const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8000;
const tools = require("./tools.js");

//allow requests from apps on other ports
app.use(cors());
app.use(helmet());
app.use(express.json());

// GET: localhost:3000/
app.get("/", (req, res) => {
  res.send("Harikar report data API");
});

app.get("/data/projects", (req, res) => {
  const fileBuffer = fs.readFileSync(`./data/projects.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

app.get("/data/projects/:id", (req, res) => {
  const { id } = req.params;
  const fileBuffer = fs.readFileSync("./data/projects.json");
  const data = JSON.parse(fileBuffer);
  const results = Object.values(data);
  const currentProject = results.filter((item) => item.id === Number(id));
  res.status(200).json(currentProject);
});

// GET: localhost:300/data
app.get("/data/:year/:month", (req, res) => {
  let { year, month } = req.params;
  const fileBuffer = fs.readFileSync(`./data/${year}/${month}.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

// GET: localhost:3000/:year
app.get("/data/:year", (req, res) => {
  const { year } = req.params;
  // read in all the data for the years data
  let months = fs.readdirSync(`./data/${year}`);

  months = tools.sortByMonthName(months);

  let monthsData = {};

  months.forEach((month) => {
    try {
      const fileBuffer = fs.readFileSync(`./data/${year}/${month}`);
      const data = JSON.parse(fileBuffer);
      month = month.replace(/.json/, "");
      monthsData[month] = data;
    } catch (e) {
      res.status(400).json({ message: "file not found" });
    }
  });

  res.send(JSON.stringify(monthsData));
});

app.get("/v2/months/:year", (req, res) => {
  const { year } = req.params;
  // read in all the data for the years data
  let months = fs.readdirSync(`./data/${year}`);
  months = tools.sortByMonthName(months);
  const results = months.map((month) => {
    return month.split(".")[0];
  });

  res.status(200).json(results);
});

app.get("/v2/data/:year", (req, res) => {
  const { year } = req.params;

  const yearData = tools.getYearData(year);

  // res.send(JSON.stringify(bothData));
  res.status(200).json(yearData);
});

app.get("/v2/data/:year/:month", (req, res) => {
  let { year, month } = req.params;

  const yearData = tools
    .getMonthData(year, month)
    .filter((item) => item.month === month);

  monthsData = {
    info: yearData.filter((item) => item.nameOfProject),
    activities: yearData.filter((item) => item.activity),
    summaries:
      year === "2020"
        ? yearData.filter((item) => item.GeneralHighlights)
        : yearData.filter((item) => item.summary),
  };

  res.status(200).json(monthsData);
});

app.get("/v2/projects/", (req, res) => {
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`
  );
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

app.get("/v2/policies/", (req, res) => {
  const fileBuffer = fs.readFileSync(`${__dirname}/public/policies.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

app.get("/v2/projects/:id", (req, res) => {
  const { id } = req.params;
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`
  );
  const data = JSON.parse(fileBuffer);
  const { projects } = data;
  const currentProject = projects.filter((item) => item.id === Number(id));
  res.status(200).json(currentProject);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
