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

  const data = tools.getYearData(year);
  const cleanedYearData = tools.cleanWashDoubleCounting(data);
  const yearData = {
    data: cleanedYearData,
    total: cleanedYearData.map((item) => item.total).sum(),
    gender: {
      male: cleanedYearData.map((item) => item.male).sum(),
      female: cleanedYearData.map((item) => item.female).sum(),
    },
    location: {
      camp: cleanedYearData
        .filter((item) => item.location === "Camp")
        .map((item) => item.total)
        .sum(),
      noncamp: cleanedYearData
        .filter((item) => item.location === "NonCamp")
        .map((item) => item.total)
        .sum(),
    },
    type: {
      idps: cleanedYearData
        .filter((item) => item.typeOfBeneficiaries === "IDPs")
        .map((item) => item.total)
        .sum(),
      refugees: cleanedYearData
        .filter((item) => item.typeOfBeneficiaries === "Refugee")
        .map((item) => item.total)
        .sum(),
      returnees: cleanedYearData
        .filter((item) => item.typeOfBeneficiaries === "Returnees")
        .map((item) => item.total)
        .sum(),
      host: cleanedYearData
        .filter((item) => item.typeOfBeneficiaries === "Host Community")
        .map((item) => item.total)
        .sum(),
    },
  };

  // res.send(JSON.stringify(bothData));
  res.status(200).json(yearData);
});

app.get("/v2/data/:year/:month", (req, res) => {
  let { year, month } = req.params;

  const yearData = tools
    .getMonthData(year, month)
    .filter((item) => item.month === month);

  const monthsData = {
    info: yearData.filter((item) => item.nameOfProject),
    activities: yearData.filter((item) => item.activity),
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

app.get("/v2/policies/", (req, res) => {
  const fileBuffer = fs.readFileSync(`${__dirname}/public/policies.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
