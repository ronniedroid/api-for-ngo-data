import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import compression from "compression";
import { fileURLToPath } from "url";
import path from "path";

import {
  getYearData,
  getMonthData,
  getMonths,
  getProjectsData,
  cleanWashDoubleCounting,
  generateYearData,
  generateMonthData,
} from "./tools.js";
// custom js array methods
import "./methods.js";

// init express app and set port
const app = express();
const port = process.env.PORT || 8000;
// middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
// First find out the __dirname, then resolve to one higher level in the dir tree
const __dirname = path.resolve(path.dirname(__filename), "../");

// Home Page points
app.get("/", (req, res) => {
  res.send("Harikar report data API");
});

/// v2 - data for years from 2020 to 2022

app.get("/v2/data/:year", (req, res) => {
  const { year } = req.params;

  const data = getYearData(year);
  let yearData = [];
  if (year === "2020" || year === "2021") {
    const cleanedYearData = cleanWashDoubleCounting(data);
    yearData = cleanedYearData.filter((item) => !item.activity);
  } else {
    yearData = data.filter((item) => !item.activity);
  }

  res.status(200).json(yearData);
});

app.get("/v2/data/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const allData = getMonthData(year, month);
  const monthData = {
    info: allData.filter((item) => !item.activity),
    activities: allData.filter((item) => item.activity),
  };

  res.status(200).json(monthData);
});

app.get("/v2/dashboard/:year", (req, res) => {
  const { year } = req.params;

  const yearData = getYearData(year).filter((item) => !item.activity);
  let filteredYearData = {};
  if (year === "2020" || year === "2021") {
    filteredYearData = cleanWashDoubleCounting(yearData);
  } else {
    filteredYearData = yearData;
  }

  const monthData = (month) => {
    return {
      beneficiaries: getMonthData(year, month).filter((item) => !item.activity),
      activities: getMonthData(year, month).filter((item) => item.activity),
    };
  };
  const months = [...getMonths(year)];

  const results = {
    months,
    "year": generateYearData(filteredYearData, months),
  };

  months.map((month) => {
    results[month] = generateMonthData(monthData(month));
  });

  res.status(200).json(results);
});

/// v3

// data for the whole year
app.get("/v3/data/years", (reg, res) => {
  const data = [
    ...getYearData("2020").filter((item) => !item.activity),
    ...getYearData("2021").filter((item) => !item.activity),
    ...getYearData("2022").filter((item) => !item.activity),
    ...getYearData("2023"),
  ];

  res.status(200).json(data);
});

app.get("/v3/data/:year", (req, res) => {
  const { year } = req.params;

  if (year < 2023) {
    res.redirect(`/v2/data/${year}`);
  } else {
    const yearData = getYearData(year);

    res.status(200).json(yearData);
  }
});

// data for a month
app.get("/v3/data/:year/:month", (req, res) => {
  const { year, month } = req.params;

  if (year < 2023) {
    res.redirect(`/v2/data/${year}/${month}`);
  } else {
    const monthData = getMonthData(year, month);

    res.status(200).json(monthData);
  }
});

// structred data for the yera, to be used on the dashboard
app.get("/v3/dashboard/:year", (req, res) => {
  const { year } = req.params;

  if (year < 2023) {
    res.redirect(`/v2/dashboard/${year}`);
  } else {
    const yearData = getYearData(year);

    const monthData = (month) => {
      return getMonthData(year, month);
    };

    const months = [...getMonths(year)];

    const results = {
      months,
      "year": generateYearData(yearData, months),
    };

    months.map((month) => {
      results[month] = generateMonthData(monthData(month));
    });

    res.status(200).json(results);
  }
});

// Projects info
app.get("/v3/projects/", (req, res) => {
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`
  );
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

// single project info
app.get("/v3/projects/:id", (req, res) => {
  const { id } = req.params;
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`
  );
  const data = JSON.parse(fileBuffer);
  const { projects } = data;
  const currentProject = projects.filter((item) => item.id === Number(id))[0];
  res.status(200).json(currentProject);
});

// get a list of projects for the year plus their data
app.get("/v3/projects-data/:year", (req, res) => {
  const { year } = req.params;

  const f = Intl.NumberFormat("en", { notation: "compact" });

  let yearData = [];
  if (year < 2023) {
    yearData = getYearData(year).filter((item) => !item.activity);
  } else {
    yearData = getYearData(year);
  }
  const projectsData = getProjectsData(yearData);

  res.status(200).json(projectsData);
});

// Get a list of Harikar policies
app.get("/v3/policies/", (req, res) => {
  const fileBuffer = fs.readFileSync(`${__dirname}/public/policies.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
