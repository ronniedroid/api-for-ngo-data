const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 8000;
const tools = require("./tools.js");
const compression = require("compression");
const { getClusters } = require("./tools.js");

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
  const months = fs.readdirSync(`./data/${year}`);
  const sortedMonths = tools.sortByMonthName(months);
  const results = sortedMonths.map((month) => {
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
  } else {
    yearData = data.filter((item) => !item.activity);
  }

  res.status(200).json(yearData);
});

app.get("/v2/data/:year/:month", (req, res) => {
  const { year, month } = req.params;

  const allData = tools.getMonthData(year, month);
  const monthData = {
    info: allData.filter((item) => !item.activity),
    activities: allData.filter((item) => item.activity),
  };

  res.status(200).json(monthData);
});

app.get("/v2/dashboard/:year", (req, res) => {
  const { year } = req.params;

  const allData = tools.getYearData(year);
  let data = [];
  if (year === "2020" || year === "2021") {
    const cleanedYearData = tools.cleanWashDoubleCounting(allData);
    data = cleanedYearData.filter((item) => !item.activity);
  } else {
    data = allData.filter((item) => !item.activity);
  }

  const clusters = [
    "general",
    "Protection",
    "GBV",
    "CP",
    "Health",
    "Livelihood",
    "WASH",
  ];

  const results = {
    general: {},
    Protection: {},
    "GBV": {},
    "CP": {},
    "Health": {},
    "Livelihood": {},
    "WASH": {},
  };

  clusters.map((cluster) => {
    const filteredCluster = cluster === "general" ? "" : cluster;
    results[cluster] = {
      bens: {
        total: tools.getBens(data, "total", filteredCluster),
        male: tools.getBens(data, "male", filteredCluster),
        female: tools.getBens(data, "female", filteredCluster),
      },
      locations: {
        camp: tools.getLocs(data, "Camp", filteredCluster),
        nonCamp: tools.getLocs(data, "NonCamp", filteredCluster),
      },
      types: {
        idps: tools.getTypes(data, "IDPs", filteredCluster),
        refugees: tools.getTypes(data, "Refugee", filteredCluster),
        returnees: tools.getTypes(data, "Returnees", filteredCluster),
        host: tools.getTypes(data, "Host Community", filteredCluster),
      },
      govs: {
        duhok: tools.getGov(data, "Duhok", filteredCluster),
        erbil: tools.getGov(data, "Erbil", filteredCluster),
        nineveh: tools.getGov(data, "Nineveh", filteredCluster),
      },
      gender: {
        male: tools.getGen(data, "male", filteredCluster),
        female: tools.getGen(data, "female", filteredCluster),
      },
      districts: {
        category: tools
          .getDist(data, filteredCluster)
          .map((item) => item.category),
        series: tools.getDist(data, filteredCluster).map((item) => item.series),
      },
      months: cluster === "general" ? tools.getMonths(year) : "",

      clusters: getClusters(data),
    };
  });
  res.status(200).json(results);
});

app.get("/v2/dashboard/:year/:month", (req, res) => {
  let { year, month } = req.params;

  const allData = tools.getMonthData(year, month);

  const data = allData.filter((item) => !item.activity);

  const clusters = [
    "general",
    "Protection",
    "GBV",
    "CP",
    "Health",
    "Livelihood",
    "WASH",
  ];

  const results = {
    general: {},
    Protection: {},
    "GBV": {},
    "CP": {},
    "Health": {},
    "Livelihood": {},
    "WASH": {},
  };

  clusters.map((cluster) => {
    const filteredCluster = cluster === "general" ? "" : cluster;
    results[cluster] = {
      bens: {
        total: tools.getBens(data, "total", filteredCluster),
        male: tools.getBens(data, "male", filteredCluster),
        female: tools.getBens(data, "female", filteredCluster),
      },
      locations: {
        camp: tools.getLocs(data, "Camp", filteredCluster),
        nonCamp: tools.getLocs(data, "NonCamp", filteredCluster),
      },
      types: {
        idps: tools.getTypes(data, "IDPs", filteredCluster),
        refugees: tools.getTypes(data, "Refugee", filteredCluster),
        returnees: tools.getTypes(data, "Returnees", filteredCluster),
        host: tools.getTypes(data, "Host Community", filteredCluster),
      },
      govs: {
        duhok: tools.getGov(data, "Duhok", filteredCluster),
        erbil: tools.getGov(data, "Erbil", filteredCluster),
        nineveh: tools.getGov(data, "Nineveh", filteredCluster),
      },
      gender: {
        male: tools.getGen(data, "male", filteredCluster),
        female: tools.getGen(data, "female", filteredCluster),
      },
      districts: {
        category: tools
          .getDist(data, filteredCluster)
          .map((item) => item.category),
        series: tools.getDist(data, filteredCluster).map((item) => item.series),
      },
      activities: allData.filter((item) => item.activity),
      clusters: getClusters(data),
    };
  });

  res.status(200).json(results);
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
  const currentProject = projects.filter((item) => item.id === Number(id))[0];
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
  posts.map((item) => {
    if (item.platform === "fb") {
      item.id = `https://www.facebook.com/Harikar2004/posts/${item.id}`;
    }
  });
  res.status(200).json(posts);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
