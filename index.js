import express from "express";
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
const redirectUri = "https://321c-2405-dc00-ecbc-713f-f15c-13bb-e4a6-ca4f.ngrok-free.app/callback";
let access_token, expires_in, refresh_token;

app.use(bodyParser.urlencoded({ extended: true}));
// app.use(express.static("public"));

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
    console.log ("Access token " + access_token);
    console.log ("expires_in " + expires_in);
    console.log("refresh_token " + refresh_token);
    res.send("Authentication successful! Tokens recieved. Hippie!!!")
  }
  catch(error){
    res.send("An error occured!");
  }

});

console.log(access_token);

//function to retrieve job details using job endpoint of servicem8
async function getJobDetails(access_token){
  // console.log(access_token);
  try{
    const response = await axios.get("https://api.servicem8.com/api_1.0/job.json", {
      headers: {
        Authorization : `Bearer ${access_token}`,
      }
    });

    console.log(response.data);

  }catch(error){
    console.error("Error fetching job details!");
  }
}

getJobDetails(access_token);

app.listen(port, () => {
  console.log(`Your server is running in port ${port}`);
});