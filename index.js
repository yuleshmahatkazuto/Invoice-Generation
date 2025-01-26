import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientId = "753345";
const clientSecret = "c5c685a22e55484bafc32256f124d11b"
const authURL = "https://go.servicem8.com/oauth/authorize";
const redirectUri = "http://localhost:3000/callback";

app.use(bodyParser.urlencoded({ extended: true}));
// app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
})




app.get("/auth", (req, res) => {
  const params = `?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=manage_jobs%20manage_job_contacts`;
  res.redirect(authURL + params);
});

app.get("/callback", async(req, res) => {
  const authorizationCode = req.query.code;
});

app.listen(port, () => {
  console.log(`Your server is running in port ${port}`);
})