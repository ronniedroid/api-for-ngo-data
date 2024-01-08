import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { sortByMonthName, groupElementsByFunc, addEmpty, sortDistricts, defaultGrouping } from "./utils.js";

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
  const governmentData = groupElementsByFunc(filteredData, "month", defaultGrouping).map(
    (provinceLists) => {
      return { month: provinceLists.name, total: provinceLists.total };
    }
  );
  const govDataWithEmpty = addEmpty(months, governmentData);
  return govDataWithEmpty;
}

function getGen(data, months, gender, cluster) {
  const filteredMonths = cluster ? data.filterBy("cluster", cluster) : data;
  const genderData = groupElementsByFunc(filteredMonths, "month", defaultGrouping).map(
    (gendersLists) => {
      return { month: gendersLists.name, total: gendersLists[gender] };
    }
  );
  const genderDataWithEmpty = addEmpty(months, genderData);
  return genderDataWithEmpty;
}

function getDist(data, cluster) {
  const filteredData = cluster ? data.filterBy("cluster", cluster) : data;

  const rest = (prop, item) => {

    const uniqueLocations = groupElementsByFunc(item, "location", defaultGrouping)
    const uniqueTypes = groupElementsByFunc(item, "typeOfBeneficiaries", defaultGrouping)

    return {
      name: item[0][prop],
      idps: uniqueTypes.filter((item) => item.name === "IDPs").map(item => item.total).sum(),
      refugees: uniqueTypes.filter((item) => item.name === "Refugee").map(item => item.total).sum(),
      returnees: uniqueTypes.filter((item) => item.name === "Returnees").map(item => item.total).sum(),
      host: uniqueTypes.filter((item) => item.name === "Host community").map(item => item.total).sum(),
      camp: uniqueLocations.filter((item) => item.name === "Camp").map(item => item.total).sum(),
      urban: uniqueLocations.filter((item) => item.name === "NonCamp").map(item => item.total).sum(),
      male: uniqueLocations.map(item => item.male).sum(),
      female: uniqueLocations.map(item => item.female).sum(),
      total: item.map((ad) => ad.total).sum(),
    }
  };

  const uniqueDistricts = groupElementsByFunc(filteredData, "district", rest).sort(
    sortDistricts
  );
  return uniqueDistricts;
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
  const uniqueClusters = groupElementsByFunc(data, "cluster", defaultGrouping)
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
  const nameGroupedActivities = groupElementsByFunc(filteredActivities, "activity", defaultGrouping);
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

function getGeneralData(data, year, month) {

  const filteredData = month ? data.filter((item) => item.month === month) : data

  const beneficiaries = filteredData.map((ad) => { return { bens: ad.typeOfBeneficiaries, male: ad.male, female: ad.female, total: ad.total } })
  const uniqueBeneficiaries = groupElementsByFunc(beneficiaries, "bens", defaultGrouping)

  return {
    year: year,
    month: month ? month : null,
    beneficiaries: uniqueBeneficiaries,
    districts: getDist(filteredData),
    gender: month ? null : { male: getGen(filteredData, getMonths(year), "male", ""), female: getGen(filteredData, getMonths(year), "female", "") },
    male: filteredData
      .filter((ad) => ad.male)
      .map((ad) => ad.male)
      .sum(),
    female: filteredData
      .filter((ad) => ad.female)
      .map((ad) => ad.female)
      .sum(),
    urban: filteredData
      .filter((ad) => ad.location === "NonCamp")
      .map((ad) => ad.total)
      .sum(),
    camp: filteredData
      .filter((ad) => ad.location === "Camp")
      .map((ad) => ad.total)
      .sum(),
    total: filteredData.map((ad) => ad.total).sum(),
  };
};

function getProjectsData(data, year, month) {

  const rest = (prop, item) => {

    const activities = item.map((ad) => { return { act: ad.activity, male: ad.male, female: ad.female, total: ad.total } })
    const uniqueActivities = groupElementsByFunc(activities, "act", defaultGrouping)

    const beneficiaries = item.map((ad) => { return { bens: ad.typeOfBeneficiaries, male: ad.male, female: ad.female, total: ad.total } })
    const uniqueBeneficiaries = groupElementsByFunc(beneficiaries, "bens", defaultGrouping)

    return {
      nameOfProject: item.map((ad) => ad.nameOfProject)[0],
      name: item[0][prop],
      year: year,
      month: month ? month : null,
      clusters: [...new Set(item.map((ad) => ad.cluster))],
      objectives: [...new Set(item.map((ad) => ad.objective))],
      beneficiaries: uniqueBeneficiaries,
      activities: year < 2023 ? null : uniqueActivities,
      districts: getDist(item),
      gender: month ? null : { male: getGen(item, getMonths(year), "male", ""), female: getGen(item, getMonths(year), "female", "") },
      male: item
        .filter((ad) => ad.male)
        .map((ad) => ad.male)
        .sum(),
      female: item
        .filter((ad) => ad.female)
        .map((ad) => ad.female)
        .sum(),
      urban: item
        .filter((ad) => ad.location === "NonCamp")
        .map((ad) => ad.total)
        .sum(),
      camp: item
        .filter((ad) => ad.location === "Camp")
        .map((ad) => ad.total)
        .sum(),
      total: item.map((ad) => ad.total).sum(),
    };
  };

  const filteredData = month ? data.filter((item) => item.month === month) : data

  const uniqueProjects = groupElementsByFunc(filteredData, "nameOfProject", rest)
  return uniqueProjects;
}

function getProjectComponentsData(data, year, month) {

  const rest = (prop, item) => {

    const activities = item.map((ad) => { return { act: ad.activity, male: ad.male, female: ad.female, total: ad.total } })
    const uniqueActivities = groupElementsByFunc(activities, "act", defaultGrouping)

    const beneficiaries = item.map((ad) => { return { bens: ad.typeOfBeneficiaries, male: ad.male, female: ad.female, total: ad.total } })
    const uniqueBeneficiaries = groupElementsByFunc(beneficiaries, "bens", defaultGrouping)

    return {
      nameOfProject: item.map((ad) => ad.nameOfProject)[0],
      name: item[0][prop],
      year: year,
      month: month ? month : null,
      clusters: [...new Set(item.map((ad) => ad.cluster))],
      objectives: [...new Set(item.map((ad) => ad.objective))],
      beneficiaries: uniqueBeneficiaries,
      activities: year < 2023 ? null : uniqueActivities,
      districts: getDist(item),
      gender: month ? null : { male: getGen(item, getMonths(year), "male", ""), female: getGen(item, getMonths(year), "female", "") },
      male: item
        .filter((ad) => ad.male)
        .map((ad) => ad.male)
        .sum(),
      female: item
        .filter((ad) => ad.female)
        .map((ad) => ad.female)
        .sum(),
      urban: item
        .filter((ad) => ad.location === "NonCamp")
        .map((ad) => ad.total)
        .sum(),
      camp: item
        .filter((ad) => ad.location === "Camp")
        .map((ad) => ad.total)
        .sum(),
      total: item.map((ad) => ad.total).sum(),
    };
  };

  const filteredData = month ? data.filter((item) => item.month === month) : data

  const uniqueComponents = groupElementsByFunc(filteredData, "Component", rest).filter((item) => !!item.name).groupBy("nameOfProject")
  return uniqueComponents;
}

export { getYearData, getMonthData, getMonths, getProjectsData, cleanWashDoubleCounting, generateYearData, generateMonthData, getGeneralData, getProjectComponentsData }