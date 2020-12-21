const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8000;

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

  function sortByMonthName(monthNames, isReverse = false) {
    const referenceMonthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const directionFactor = isReverse ? -1 : 1;
    const comparator = (a, b) => {
      if (!a && !b) return 0;
      if (!a && b) return -1 * directionFactor;
      if (a && !b) return 1 * directionFactor;

      const comparableA = a.toLowerCase().substring(0, 3);
      const comparableB = b.toLowerCase().substring(0, 3);
      const comparisonResult =
        referenceMonthNames.indexOf(comparableA) -
        referenceMonthNames.indexOf(comparableB);
      return comparisonResult * directionFactor;
    };
    const safeCopyMonthNames = [...monthNames];
    safeCopyMonthNames.sort(comparator);
    return safeCopyMonthNames;
  }
  months = sortByMonthName(months);

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

  res.send(monthsData);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
