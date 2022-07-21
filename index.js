const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8000;
const tools = require("./tools.js");
const compression = require("compression");

//allow requests from apps on other ports
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());

// GET: localhost:8000/
app.get("/", (req, res) => {
  res.send("Harikar report data API");
});

app.get("/v2/monthsList/:year", (req, res) => {
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
  let yearData = [];
  if (year === "2020" || year === "2021") {
    const cleanedYearData = tools.cleanWashDoubleCounting(data);
    yearData = cleanedYearData.filter((item) => !item.activity);
    console.log("it works");
  } else {
    yearData = data.filter((item) => !item.activity);
  }

  res.status(200).json(yearData);
});

app.get("/v2/data/:year/:month", (req, res) => {
  let { year, month } = req.params;

  const data = tools.getMonthData(year, month);

  const monthData = {
    info: data.filter((item) => !item.activity),
    activities: data.filter((item) => item.activity),
  };

  res.status(200).json(monthData);
});

app.get("/v2/projects/", (req, res) => {
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`
  );
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

app.get("/v2/projectsmini/", (req, res) => {
  const fileBuffer = fs.readFileSync(
    `${__dirname}/public/projects/projects.json`
  );
  const data = JSON.parse(fileBuffer);
  const { projects } = data;
  const filteredData = projects
    .map((item) => ({
      id: item.id,
      name: item.name,
      state: item.state,
      partner: item.partners,
    }))
    .filter((item) => item.state === "onGoing");
  res.status(200).json(filteredData);
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

app.get("/v2/social", (req, res) => {
    const fileBuffer = fs.readFileSync(`${__dirname}/public/posts/posts.json`);
    const { posts } = JSON.parse(fileBuffer);
    const fileredPosts = posts.map((item) => {
        if (item.platform === 'fb') {
            item.id = `https://www.facebook.com/Harikar2004/posts/${item.id}`;
        }
    });
    console.log(fileredPosts);
    res.status(200).json(posts);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
