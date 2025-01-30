import express, { response } from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';
import axios from 'axios';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientId = "753345";
const clientSecret = "c5c685a22e55484bafc32256f124d11b"
const authURL = "https://go.servicem8.com/oauth/authorize";
const redirectUri = "https://8582-122-105-231-136.ngrok-free.app/callback";
const my_UUID = '1516b609-0860-4921-a15a-2027953c8f3b';
let access_token, expires_in, refresh_token;
const jobsByDate = new Map();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/activate-addon", (req, res) => {
  res.send("Congratulations, your addon is now activated!!!");
});




app.get("/auth", (req, res) => {
  const params = `?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=manage_jobs%20manage_job_contacts`;
  res.redirect(authURL + params);
});

app.get("/callback", async(req, res) => {
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
    res.send(`Authentication successful! Tokens recieved. Hippie!!!
      <a href="/jobs"> Get jobs </a>`);
  }
  catch(error){
    res.send("An error occured!");
  }

});

app.get("/jobs", async(req, res) => {
  if(!access_token){
    res.send("Access token not available yet");
  }else{
    try{
      console.log(access_token);
      const response = await axios.get("https://api.servicem8.com/api_1.0/Job.json", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        params: {
          $filter: "completion_date gt '2025-01-19 00:00:00'",
        } 
    });
      const jobs = response.data;
      const jobsById = filterJobsByCompletionId(jobs);
      console.log(jobsById.length);
      jobsById.forEach(job => {
        const date = job.completion_date.split(" ")[0];
        if(!jobsByDate.has(date)){
          jobsByDate.set(date, []);
        }

        jobsByDate.get(date).push(job);
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

      console.log(jobsByDate);
      res.render(path.join(__dirname, "views/invoice.ejs"), {jobMap: jobsByDate});
      // res.json(Object.fromEntries(jobsByDate));
    }catch(error){
      console.error("Error fetching job details:", error.response?.data || error.message);
    }
  }
});

app.listen(port, () => {
  console.log(`Your server is running in port ${port}`);
});