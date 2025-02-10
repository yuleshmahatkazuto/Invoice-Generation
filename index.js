import express, { response } from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import {
  timeExtractor,
  payCalculator,
  timeDiffCalculator,
  timeConverter,
} from "./payCalculator.js";
import 'dotenv/config';
import fs from 'fs/promises';
import ejs from 'ejs';

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientId = "753345";
const clientSecret = "c5c685a22e55484bafc32256f124d11b";
const authURL = "https://go.servicem8.com/oauth/authorize";
const redirectUri = "https://invoice-generation-uykq.onrender.com/callback";
const my_UUID = "1516b609-0860-4921-a15a-2027953c8f3b";
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
let access_token, expires_in, refresh_token;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));  

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/activate-addon", (req, res) => {
  res.send("Congratulations, your addon is now activated!!!");
});

app.get("/auth", (req, res) => {
  const params = `?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=manage_jobs%20read_job_contacts`;
  res.redirect(authURL + params);
});

app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/callback", async (req, res) => {
  const authorizationCode = req.query.code;
  if (!authorizationCode) {
    return res.status(400).send("Authorization code not provided by Servicem8");
  }
  try {
    const response = await axios.post(
      `https://api.servicem8.com/oauth/access_token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }
    );
    ({access_token, refresh_token, expires_in} = response.data);
    console.log(`Your access token is ${access_token}`);
    res.redirect("/home");
  } catch (error) {
    res.send("An error occured!");
  }
});

let startDate, endDate, invoiceNo = "";

app.get("/submission_form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "submissionForm.html"));
});

let arrayOfObjects = [];
app.post("/submit", (req, res) => {
  const inputData = req.body.notes;
  const eachDay = inputData
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => line.trim() !== "");

  arrayOfObjects = timeExtractor(eachDay);
  res.redirect("/home");
});

app.post("/getDate", (req, res) => {
  startDate = req.body.startdate;
  endDate = req.body.enddate;
  invoiceNo = req.body.invoiceNo;
  res.redirect("/home");
});

const url_browserless = `https://production-sfo.browserless.io/pdf?token=${BROWSERLESS_API_KEY}`;
  const headers_browserless = {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json"
  };


app.get("/jobs", async (req, res) => {
  let [payMap, totalPay] = timeFormatConverter(arrayOfObjects);
  if (!access_token) {
    res.send("Access token not available yet");
  } else {
    try {
      const jobresponse = await axios.get(
        "https://api.servicem8.com/api_1.0/Job.json",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          params: {
            $filter: `completion_date gt '${startDate} 00:00:00'`,
          },
        }
      );
      const companyResponse = await axios.get(
        "https://api.servicem8.com/api_1.0/JobContact.json",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      const customerName = new Map();
      companyResponse.data.forEach((customer) => {
        customerName.set(
          customer.job_uuid,
          customer.first + " " + customer.last
        );
      });

      const jobs = jobresponse.data.filter(
        (job) => job.completion_date.split(" ")[0] <= endDate
      );
      const jobsById = filterJobsByCompletionId(jobs);
      const jobsByDate = [];
      const dateCount = {};
      jobsById.forEach((job) => {
        const date = job.completion_date.split(" ")[0]; // Extract the date part
        dateCount[date] = (dateCount[date] || 0) + 1; // Increment count for this date
      });
      jobsById.forEach((job) => {
        const date = job.completion_date.split(" ")[0];

        const customer_Name = customerName.get(job.uuid) || "";
        let dateEntry = jobsByDate.find((entry) => entry.date === date);
        if (!dateEntry) {
          dateEntry = { date: date, jobs: [] };
          jobsByDate.push(dateEntry);
        }
        dateEntry.jobs.push({
          rowSpan: dateCount[date],
          jobID: job.generated_job_id,
          date: date,
          customerName: customer_Name,
          jobAddress: job.geo_city,
          labourCharge: payMap.get(date),
          paymentMethod: job.payment_method,
        });
      });
      const ejsData = {
        jobs: jobsByDate,
        invoiceNo: invoiceNo,
        totalPay: totalPay
      };
      const html = ejs.render(path.join(__dirname, "views/invoice.ejs"), ejsData);
      const queryParam = req.query.pdf === 'true';
      if(queryParam){
        try{
          const pdfBuffer = await generatePDF(html);
          res.contentType('application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
          res.send(pdfBuffer);
        }catch(error){
          console.error("Error occured during pdf generation", error);
        }
      }else{
        console.log("Else part was triggered!");
        res.send(html);
      }
    } catch (error) {
      console.error(
        "Error fetching job details:",
        error.response?.data || error.message
      );
    }
  }
});

async function generatePDF(html){ // Takes HTML as input
  const data = {
    html: html, // Use HTML content directly
    options: {
      displayHeaderFooter: true,
      printBackground: true, // Set to true if you want background printed
      format: "A4", // Set to your desired format
      margin: {  // Example margin settings
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    }
  };

  try {
    const response = await axios.post(url_browserless, data, {
      headers: headers_browserless,
      responseType: 'arraybuffer' // Crucial: Get response as buffer
    });

    // Write the PDF to a file (or send it in the response)
    await fs.writeFile("invoice.pdf", Buffer.from(response.data)); // Use your desired filename
    console.log("PDF saved as invoice.pdf");
    return Buffer.from(response.data); // Return the buffer, so you can send it in the response
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (error.response) {
      console.error("Browserless Response:", error.response.data); // Log the detailed error from Browserless
    }
    throw error; // Re-throw the error to be handled by the caller
  }
}


//helper function to filter the response.data using my uuid.
function filterJobsByCompletionId(jobs) {
  const jobsById = jobs.filter((job) => {
    if (!job.completion_date) {
      return false;
    }
    const jobDate = job.completion_date.split(" ")[0];
    return job.completion_actioned_by_uuid === my_UUID;
  });
  return jobsById;
}

//to convert the original time from the notes to the format of servicem8
function timeFormatConverter(array) {
  const datePayMap = new Map();
  const monthMap = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
  };
  
  let totalPay = 0;
  array.forEach((day) => {
    let dateArr = day.original.split(" ");
    let month = monthMap[dateArr[2]];
    let date = "2025-" + month.toString() + "-" + dateArr[1].padStart(2,"0");
    if(datePayMap.has(date)){
      datePayMap.set(date, datePayMap.get(date) + day.pay);
    }else{
      datePayMap.set(date, day.pay);
    }   
    totalPay += day.pay; 
  });
  return [datePayMap, totalPay];
}

app.listen(port,() => {
  console.log(`Server running on http://localhost:${port}`);
});
