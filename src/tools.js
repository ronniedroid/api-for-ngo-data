import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { sortByMonthName, groupElements, addEmpty, sortDistricts } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
// First find out the __dirname, then resolve to one higher level in the dir tree
const __dirname = path.resolve(path.dirname(__filename), "../");

function cleanWashDoubleCounting(yearData) {
  const adjustedYearData = yearData
    .filter((item) => {
      if (
        !(
          item.month === "february" &&
          item.cluster === "WASH" &&
          item.typeOfBeneficiaries === "IDPs" &&
          item.nameOfProject ===
            "WASH, Protection and SRHR support to IDPs and Returnees in Iraq 2020-2021" &&
          item.objective !==
            "Water infrastructure repaired, maintained, or rehabilitated in IDP camps and Sinjar"
        )
      )
        return item;
    })
    .filter(function (item) {
      if (
        !(
          item.cluster === "WASH" &&
          item.nameOfProject ===
            "WASH, Protection and SRHR support to IDPs and Returnees in Iraq 2020-2021" &&
          item.typeOfBeneficiaries === "IDPs" &&
          item.month !== "february"
        )
      )
        return item;
    });
  return adjustedYearData;
}

function getYearData(year) {
  let months = fs
    .readdirSync(`${__dirname}/public/data/${year}`)
    .map((month) => month.split(".")[0]);

  months = sortByMonthName(months);

  let results = [];
  months.map((month) => {
    const fileBuffer = fs.readFileSync(`${__dirname}/public/data/${year}/${month}.json`);
    const data = JSON.parse(fileBuffer);
    results = [...results, ...data];
  });
  return results;
}

function getMonthData(year, month) {
  let currentMonth = fs.readFileSync(`${__dirname}/public/data/${year}/${month}.json`);

  const data = JSON.parse(currentMonth);
  return data;
}

function getBens(data, ben, cluster) {
  const beneficiaries = cluster
    ? data
        .filterBy("cluster", cluster)
        .filter((item) => item[ben])
        .map((item) => item[ben])
        .sum()
    : data
        .filter((item) => item[ben])
        .map((item) => item[ben])
        .sum();
  return beneficiaries;
}

function getLocs(data, loc, cluster) {
  const location = cluster
    ? data
        .filterBy("cluster", cluster)
        .filterBy("location", loc)
        .map((item) => item.total)
        .sum()
    : data
        .filterBy("location", loc)
        .map((item) => item.total)
        .sum();
  return location;
}

function getTypes(data, type, cluster) {
  const types = cluster
    ? data
        .filterBy("cluster", cluster)
        .filterBy("typeOfBeneficiaries", type)
        .map((item) => item.total)
        .sum()
    : data
        .filterBy("typeOfBeneficiaries", type)
        .map((item) => item.total)
        .sum();
  return types;
}

function getGov(data, months, province, cluster) {
  const filteredData = cluster
    ? data.filterBy("cluster", cluster).filterBy("province", province)
    : data.filterBy("province", province);
  const governmentData = groupElements(filteredData, "month").map(
    (provinceLists) => {
      return { month: provinceLists.name, total: provinceLists.total };
    }
  );
  const govDataWithEmpty = addEmpty(months, governmentData);
  return govDataWithEmpty;
}

function getGen(data, months, gender, cluster) {
  const filteredMonths = cluster ? data.filterBy("cluster", cluster) : data;
  const genderData = groupElements(filteredMonths, "month").map(
    (gendersLists) => {
      return { month: gendersLists.name, total: gendersLists[gender] };
    }
  );
  const genderDataWithEmpty = addEmpty(months, genderData);
  return genderDataWithEmpty;
}

function getDist(data, cluster) {
  const filteredData = cluster ? data.filterBy("cluster", cluster) : data;
  const uniqueDistricts = groupElements(filteredData, "district").sort(
    sortDistricts
  );
  const districts = uniqueDistricts.map((districtsList) => {
    return {
      name: districtsList.name,
      total: districtsList.total,
    };
  });
  return districts;
}

function getProjectsData(data) {
  const uniqueProjects = groupElements(data, "nameOfProject");
  return uniqueProjects;
}

function getMonths(year) {
  const months = fs.readdirSync(`${__dirname}/public//data/${year}`);
  const sortedMonths = sortByMonthName(months);
  const results = sortedMonths.map((month) => {
    return month.split(".")[0];
  });
  return results;
}

function getClusters(data) {
  const uniqueClusters = groupElements(data, "cluster")
    .filter((cluster) => cluster.total > 0)
    .map((item) => item.name);

  const allClusters = [
    {
      name: "General Protection",
      abbr: "Protection",
    },
    {
      name: "Gender Based Violance",
      abbr: "GBV",
    },
    {
      name: "Health",
      abbr: "Health",
    },
    {
      name: "Child Protection",
      abbr: "CP",
    },
    {
      name: "Livelihood",
      abbr: "Livelihood",
    },
    {
      name: "Water, Sanitation and Hygiene",
      abbr: "WASH",
    },
  ];

  const clusters = allClusters.filter((item) =>
    uniqueClusters.includes(item.abbr)
  );

  return clusters;
}

function getActivities(data, cluster) {
  const filteredActivities = cluster ? data.filterBy("cluster", cluster) : data;
  const nameGroupedActivities = groupElements(filteredActivities, "activity");
  return nameGroupedActivities;
}

function generateYearClusterData(data, months, cluster) {
  return {
    bens: {
      total: getBens(data, "total", cluster),
      male: getBens(data, "male", cluster),
      female: getBens(data, "female", cluster),
    },
    locations: {
      camp: getLocs(data, "Camp", cluster),
      nonCamp: getLocs(data, "NonCamp", cluster),
    },
    types: {
      idps: getTypes(data, "IDPs", cluster),
      refugees: getTypes(data, "Refugee", cluster),
      returnees: getTypes(data, "Returnees", cluster),
      host: getTypes(data, "Host Community", cluster),
    },
    govs: {
      duhok: getGov(data, months, "Duhok", cluster),
      erbil: getGov(data, months, "Erbil", cluster),
      nineveh: getGov(data, months, "Nineveh", cluster),
    },
    gender: {
      male: getGen(data, months, "male", cluster),
      female: getGen(data, months, "female", cluster),
    },
    districts: getDist(data, cluster),
  };
}

function generateMonthClusterData(data, cluster) {
  const bens = data.beneficiaries ? data.beneficiaries : data;
  const acts = data.activities ? data.activities : data;
  return {
    bens: {
      total: getBens(bens, "total", cluster),
      male: getBens(bens, "male", cluster),
      female: getBens(bens, "female", cluster),
    },
    locations: {
      camp: getLocs(bens, "Camp", cluster),
      nonCamp: getLocs(bens, "NonCamp", cluster),
    },
    types: {
      idps: getTypes(bens, "IDPs", cluster),
      refugees: getTypes(bens, "Refugee", cluster),
      returnees: getTypes(bens, "Returnees", cluster),
      host: getTypes(bens, "Host Community", cluster),
    },
    districts: getDist(bens, cluster),
    activities: cluster
      ? getActivities(acts, cluster)
      : getActivities(acts),
  };
}

function generateYearData(data, months) {
  return {
    general: generateYearClusterData(data, months, ""),
    Protection: generateYearClusterData(
      data,
      months,
      "Protection"
    ),
    GBV: generateYearClusterData(data, months, "GBV"),
    CP: generateYearClusterData(data, months, "CP"),
    Health: generateYearClusterData(data, months, "Health"),
    Livelihood: generateYearClusterData(
      data,
      months,
      "Livelihood"
    ),
    WASH: generateYearClusterData(data, months, "WASH"),
    clusters: getClusters(data),
  };
}

function generateMonthData(data) {
  const bens = data.beneficiaries ? data.beneficiaries : data;
  return {
    general: generateMonthClusterData(data, ""),
    Protection: generateMonthClusterData(data, "Protection"),
    GBV: generateMonthClusterData(data, "GBV"),
    CP: generateMonthClusterData(data, "CP"),
    Health: generateMonthClusterData(data, "Health"),
    Livelihood: generateMonthClusterData(data, "Livelihood"),
    WASH: generateMonthClusterData(data, "WASH"),
    clusters: getClusters(bens),
  };
}

export {getYearData,getMonthData, getMonths, getProjectsData, cleanWashDoubleCounting, generateYearData, generateMonthData}