import express, { response } from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';
import axios from 'axios';
import {timeExtractor, payCalculator, timeDiffCalculator, timeConverter} from "./payCalculator.js";

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientId = "753345";
const clientSecret = "c5c685a22e55484bafc32256f124d11b"
const authURL = "https://go.servicem8.com/oauth/authorize";
const redirectUri = "https://eb8b-122-105-230-232.ngrok-free.app/callback";
const my_UUID = '1516b609-0860-4921-a15a-2027953c8f3b';
let access_token, expires_in, refresh_token;

app.use(bodyParser.urlencoded({ extended: true}));
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

app.get("/callback", async(req, res) => {

  if(access_token){
    return res.sendFile(path.join(__dirname, "public", "home.html" ));
  }

  const authorizationCode = req.query.code;

  if(!authorizationCode){
    return res.status(400).send("Authorization code not provided by Servicem8");
  }

  try{
    const response = await axios.post(`https://api.servicem8.com/oauth/access_token`,{
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    });

    ({access_token, expires_in, refresh_token} = response.data);
    console.log("Full response.data" + JSON.stringify(response.data));
    res.sendFile(path.join(__dirname, "public", "home.html"));
  }
  catch(error){
    res.send("An error occured!");
  }

});

let startDate = "";
let endDate = "";
app.get("/submission_form", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "submissionForm.html"));
});

let arrayOfObjects = [];
app.post("/submit", (req, res) => {
  const inputData = req.body.notes;
    const eachDay = inputData.replace(/\r/g,"").split("\n").filter(line => line.trim() !== "");
    
    arrayOfObjects = timeExtractor(eachDay);
    res.redirect('/callback');
});

app.post("/getDate", (req, res) => {
  startDate = req.body.startdate;
  endDate = req.body.enddate;
  res.redirect("/callback");
})

app.get("/jobs", async(req, res) => {
  let payMap = timeFormatConverter(arrayOfObjects);
  console.log(payMap);
  if(!access_token){
    res.send("Access token not available yet");
  }else{
    try{
      const jobresponse = await axios.get("https://api.servicem8.com/api_1.0/Job.json", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          $filter: `completion_date gt '${startDate} 00:00:00'`,
        } 
      });
      const companyResponse = await axios.get("https://api.servicem8.com/api_1.0/JobContact.json",{
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const customerName = new Map();
      companyResponse.data.forEach(customer => {
        customerName.set(customer.job_uuid, customer.first + " " + customer.last);
      });

      const jobs = jobresponse.data.filter(job => job.completion_date.split(" ")[0] !== endDate);
      const jobsById = filterJobsByCompletionId(jobs);
      const jobsByDate = [];
      const dateCount = {};
      jobsById.forEach(job => {
        const date = job.completion_date.split(" ")[0];  // Extract the date part
        dateCount[date] = (dateCount[date] || 0) + 1;  // Increment count for this date
      });
      jobsById.forEach(job => {
        const date = job.completion_date.split(" ")[0];
        
        const customer_Name = customerName.get(job.uuid) || "";
        let dateEntry = jobsByDate.find(entry => entry.date === date);
        if(!dateEntry){
          dateEntry = {date: date, jobs: []};
          jobsByDate.push(dateEntry);
        }
        dateEntry.jobs.push({
          rowSpan: dateCount[date],
          jobID: job.generated_job_id,
          date: date,
          customerName : customer_Name,
          jobAddress: job.geo_city,
          labourCharge: payMap.get(date),
          paymentMethod: job.payment_method,
        });
      });
      console.log(dateCount);
      res.render(path.join(__dirname, "views/invoice.ejs"), {jobs: jobsByDate});
    }catch(error){
      console.error("Error fetching job details:", error.response?.data || error.message);
    }
  }
});

 //helper function to filter the response.data using my uuid.
 function filterJobsByCompletionId(jobs){
  const jobsById = jobs.filter(job => {
    if(!job.completion_date){return false;}
    const jobDate = job.completion_date.split(" ")[0];
    return job.completion_actioned_by_uuid === my_UUID;
  });
  return jobsById;
}

//to convert the original time from the notes to the format of servicem8
function timeFormatConverter(array){
  const datePayMap = new Map();
  array.forEach(day => {
    let dateArr = day.original.split(" ");
    let month;
    switch (dateArr[2]){
      case "Jan":
        month = 1;
        break;
      case "Feb":
        month = 2;
        break;
      case "Mar":
        month = 3;
        break;
        case "Apr":
        month = 4;
        break;
      case "May":
        month = 5;
        break;
      case "Jun":
        month = 6;
        break;
        case "Jul":
        month = 7;
        break;
      case "Aug":
        month = 8;
        break;
      case "Sep":
        month = 9;
        break;
        case "Oct":
        month = 10;
        break;
      case "Nov":
        month = 11;
        break;
      case "Dec":
        month = 12;
        break;
    }
    let date = "2025-" + month.toString().padStart(2, "0") + "-" + dateArr[1];
    datePayMap.set(date, day.pay);
  });
  return datePayMap;
}

app.listen(port, () => {
  console.log(`Your server is running in port ${port}`);
});