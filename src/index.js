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
  getProjectsData,
  getGeneralData,
  getProjectComponentsData,
  getProjects,
  getMonths,
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

/// v3

// Projects info
app.get("/v3/projects/", (req, res) => {
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`,
  );
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

// single project info
app.get("/v3/projects/:id", (req, res) => {
  const { id } = req.params;
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`,
  );
  const data = JSON.parse(fileBuffer);
  const { projects } = data;
  const currentProject = projects.filter((item) => item.id === Number(id))[0];
  res.status(200).json(currentProject);
});

// Get a list of Harikar policies
app.get("/v3/policies/", (req, res) => {
  const fileBuffer = fs.readFileSync(`${__dirname}/public/policies.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

//v4

// all the data
app.get("/v4/data", (reg, res) => {
  const data = [
    ...getYearData("2020").filter((item) => !item.activity),
    ...getYearData("2021").filter((item) => !item.activity),
    ...getYearData("2022").filter((item) => !item.activity),
    ...getYearData("2023"),
  ];

  res.status(200).json(data);
});

// all data for a year
app.get("/v4/data/:year", (req, res) => {
  const { year } = req.params;

  let yearData = getYearData(year);

  res.status(200).json(yearData);
});

// all data for a month
app.get("/v4/data/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const monthData =
    year < "2023"
      ? getMonthData(year, month).filter((item) => !item.activity)
      : getMonthData(year, month);

  res.status(200).json(monthData);
});

// get dahboard data for a year
app.get("/v4/dashboard/:year", (req, res) => {
  const { year } = req.params;

  let yearData = getYearData(year);

  const results = getGeneralData(yearData, year);

  res.status(200).json(results);
});

// get dashboard data for a year/month
app.get("/v4/dashboard/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const monthData =
    year < "2023"
      ? getMonthData(year, month).filter((item) => !item.activity)
      : getMonthData(year, month);

  const results = getGeneralData(monthData, year, month);

  res.status(200).json(results);
});

// get project data for a year
app.get("/v4/projects-data/:year", (req, res) => {
  const { year } = req.params;

  let yearData = getYearData(year);

  const projectsData = getProjectsData(yearData, year);

  res.status(200).json(projectsData);
});

// get project data for a year/month
app.get("/v4/projects-data/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const monthData =
    year < "2023"
      ? getMonthData(year, month).filter((item) => !item.activity)
      : getMonthData(year, month);

  const projectsData = getProjectsData(monthData, year, month);

  res.status(200).json(projectsData);
});

// get project component data for a year
app.get("/v4/projects-components/:year", (req, res) => {
  const { year } = req.params;

  let yearData = getYearData(year);

  const componentsData = getProjectComponentsData(yearData, year);

  res.status(200).json(componentsData);
});

// get project component data for a year/month
app.get("/v4/projects-components/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const monthData =
    year < "2023"
      ? getMonthData(year, month).filter((item) => !item.activity)
      : getMonthData(year, month);

  const componentsData = getProjectComponentsData(monthData, year, month);

  res.status(200).json(componentsData);
});

app.get("/v4/currentprojects/:year", (req, res) => {
  const { year } = req.params;

  let yearData = getYearData(year);

  const currentProjects = getProjects(yearData, year);
  res.status(200).json(currentProjects);
});

app.get("/v4/currentprojects/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const monthData =
    year < "2023"
      ? getMonthData(year, month).filter((item) => !item.activity)
      : getMonthData(year, month);

  const currentProjects = getProjects(monthData, year, month);
  res.status(200).json(currentProjects);
});

app.get("/v4/currentmonths/:year", (req, res) => {
  const { year } = req.params;

  const months = getMonths(year);
  res.status(200).json(months);
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
