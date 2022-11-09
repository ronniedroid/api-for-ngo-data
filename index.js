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

  const yearData = tools.getYearData(year).filter((item) => !item.activity);
  let filteredYearData = {};
  if (year === "2020" || year === "2021") {
    filteredYearData = tools.cleanWashDoubleCounting(yearData);
  } else {
    filteredYearData = yearData;
  }

  const monthData = (month) => {
    return tools.getMonthData(year, month).filter((item) => !item.activity);
  };

  const months = [...tools.getMonths(year)];
  // const monthsAndYear = ["year", ...months];

  // let results = { months };
  // monthsAndYear.map((month) => {
  //   results[month] = {
  //     general: generateClusterData(month, "general"),
  //     Protection: generateClusterData(month, "Protection"),
  //     GBV: generateClusterData(month, "GBV"),
  //     CP: generateClusterData(month, "CP"),
  //     Health: generateClusterData(month, "Health"),
  //     Livelihood: generateClusterData(month, "Livelihood"),
  //     WASH: generateClusterData(month, "WASH"),
  //     clusters:
  //       month === "year"
  //         ? tools.getClusters(yearData)
  //         : tools.getClusters(monthData(month)),
  //   };
  // });

  function generateClusterData(data, cluster) {
    return {
      bens: {
        total: tools.getBens(data, "total", cluster),
        male: tools.getBens(data, "male", cluster),
        female: tools.getBens(data, "female", cluster),
      },
      locations: {
        camp: tools.getLocs(data, "Camp", cluster),
        nonCamp: tools.getLocs(data, "NonCamp", cluster),
      },
      types: {
        idps: tools.getTypes(data, "IDPs", cluster),
        refugees: tools.getTypes(data, "Refugee", cluster),
        returnees: tools.getTypes(data, "Returnees", cluster),
        host: tools.getTypes(data, "Host Community", cluster),
      },
      govs: {
        duhok: tools.getGov(data, months, "Duhok", cluster),
        erbil: tools.getGov(data, months, "Erbil", cluster),
        nineveh: tools.getGov(data, months, "Nineveh", cluster),
      },
      gender: {
        male: tools.getGen(data, months, "male", cluster),
        female: tools.getGen(data, months, "female", cluster),
      },
      districts: {
        category: tools.getDist(data, cluster).map((item) => item.category),
        series: tools.getDist(data, cluster).map((item) => item.series),
      },
    };
  }

  function generateMonthData(data) {
    return {
      general: generateClusterData(data, ""),
      Protection: generateClusterData(data, "Protection"),
      GBV: generateClusterData(data, "GBV"),
      CP: generateClusterData(data, "CP"),
      Health: generateClusterData(data, "Health"),
      Livelihood: generateClusterData(data, "Livelihood"),
      WASH: generateClusterData(data, "WASH"),
      clusters: tools.getClusters(data),
    };
  }

  const results = {
    months,
    "year": generateMonthData(yearData),
  };

  months.map((month) => {
    results[month] = generateMonthData(monthData(month));
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
