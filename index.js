const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 8000;
const sort = require('./sortByName.js');

//allow requests from apps on other ports
app.use(cors());
app.use(helmet());
app.use(express.json());

// GET: localhost:3000/
app.get('/', (req, res) => {
  res.send('Harikar report data API');
});

app.get('/data/projects', (req, res) => {
  const fileBuffer = fs.readFileSync(`./data/projects.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

// GET: localhost:300/data
app.get('/data/:year/:month', (req, res) => {
  let { year, month } = req.params;
  const fileBuffer = fs.readFileSync(`./data/${year}/${month}.json`);
  const data = JSON.parse(fileBuffer);
  res.status(200).json(data);
});

// GET: localhost:3000/:year
app.get('/data/:year', (req, res) => {
  const { year } = req.params;
  // read in all the data for the years data
  let months = fs.readdirSync(`./data/${year}`);

  months = sort.sortByMonthName(months);

  let monthsData = {};

  months.forEach((month) => {
    try {
      const fileBuffer = fs.readFileSync(`./data/${year}/${month}`);
      const data = JSON.parse(fileBuffer);
      month = month.replace(/.json/, '');
      monthsData[month] = data;
    } catch (e) {
      res.status(400).json({ message: 'file not found' });
    }
  });

  res.send(JSON.stringify(monthsData));
});

app.get('/months/:year', (req, res) => {
  const { year } = req.params;
  // read in all the data for the years data
  let months = fs.readdirSync(`./data/${year}`);

  months = sort.sortByMonthName(months);

  let monthsData = {};

  months.forEach((month) => {
    try {
      month = month.replace(/.json/, '');
      monthsData[month] = month;
    } catch (e) {
      res.status(400).json({ message: 'file not found' });
    }
  });

  res.send(JSON.stringify(monthsData));
});

app.get('/v2/data/:year', (req, res) => {
  const { year } = req.params;
  // read in all the data for the years data
  let months = fs.readdirSync(`./data/${year}`);

  months = sort.sortByMonthName(months);

  let mdata = {};
  monthsData = [];

  months.forEach((month) => {
    try {
      const fileBuffer = fs.readFileSync(`./data/${year}/${month}`);
      const data = JSON.parse(fileBuffer);
      month = month.replace(/.json/, '');
      mdata[month] = data;
    } catch (e) {
      res.status(400).json({ message: 'file not found' });
    }
  });

  const clusters = ['Protection', 'SGBV', 'Health', 'Livelihood', 'WASH'];
  Object.keys(mdata).forEach((month) => {
    clusters.forEach((cluster) => {
      mdata[month][cluster].forEach((obj) => {
        if (obj.Total <= 0) return;
        const {
          NameOfProject,
          Objective,
          Cluster,
          Province,
          District,
          TypeOfBeneficiaries,
          CampNonCamp,
          Male,
          Female,
          Total,
        } = obj;
        monthsData.push({
          nameOfProject: NameOfProject,
          objective: Objective,
          cluster: Cluster,
          province: Province,
          district: District,
          typeOfBeneficiaries: TypeOfBeneficiaries,
          location: CampNonCamp,
          male: Male,
          female: Female,
          total: Total,
          month: month,
        });
      });
    });
  });

  const adjustedMonthsData = monthsData.filter((item) => {
    if (
      (item.cluster === 'WASH' &&
        item.nameOfProject ===
          'WASH, Protection and SRHR support to IDPs and Returnees in Iraq 2020-2021' &&
        item.typeOfBeneficiaries === 'IDPs' &&
        item.month !== 'february') ||
      (item.month === 'february' &&
        item.cluster === 'WASH' &&
        item.typeOfBeneficiaries === 'IDPs' &&
        item.nameOfProject ===
          'WASH, Protection and SRHR support to IDPs and Returnees in Iraq 2020-2021' &&
        item.objective !==
          'Water infrastructure repaired, maintained, or rehabilitated in IDP camps and Sinjar')
    )
      return item;
  });

  const finalData = [
    ...new Set(monthsData.filter((x) => !adjustedMonthsData.includes(x))),
  ];
  const bothData = { original: monthsData, adjusted: finalData };

  res.send(JSON.stringify(bothData));
});

app.get('/v2/data/:year/:month', (req, res) => {
  let { year, month } = req.params;
  const fileBuffer = fs.readFileSync(`./data/${year}/${month}.json`);
  const data = JSON.parse(fileBuffer);
  monthsData = {
    info: [],
    activities: [],
    summaries: [],
  };
  const clusters = ['Protection', 'SGBV', 'Health', 'Livelihood', 'WASH'];
  clusters.forEach((cluster) => {
    data[cluster].forEach((obj) => {
      if (obj.Total <= 0) return;
      const {
        NameOfProject,
        Objective,
        Cluster,
        Province,
        District,
        TypeOfBeneficiaries,
        CampNonCamp,
        Male,
        Female,
        Total,
      } = obj;
      monthsData.info.push({
        nameOfProject: NameOfProject,
        objective: Objective,
        cluster: Cluster,
        province: Province,
        district: District,
        typeOfBeneficiaries: TypeOfBeneficiaries,
        location: CampNonCamp,
        male: Male,
        female: Female,
        total: Total,
      });
    });
  });

  clusters.forEach((cluster) => {
    data[cluster + 'Activities'].forEach((obj) => {
      if (obj.Total <= 0) return;
      const { Activity, TypeOfBeneficiaries, Male, Female, Total } = obj;
      monthsData.activities.push({
        activity: Activity,
        typeOfBeneficiaries: TypeOfBeneficiaries,
        male: Male,
        female: Female,
        total: Total,
        cluster: cluster,
      });
    });
  });

  clusters.forEach((cluster) => {
    data[cluster + 'Highlights'].forEach((obj) => {
      if (obj.Total <= 0) return;
      monthsData.summaries.push({
        summary: obj,
        cluster: cluster,
      });
    });
  });

  res.send(JSON.stringify(monthsData));
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
