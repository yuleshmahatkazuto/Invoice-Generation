import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("index.html");
});

app.listen(port, () => {
  console.log(`Your server is running in port ${port}`);
})