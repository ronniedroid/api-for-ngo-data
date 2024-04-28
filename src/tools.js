import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import {
  sortByMonthName,
  groupElementsByFunc,
  addEmpty,
  sortDistricts,
  defaultGrouping,
} from "./utils.js";

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
    const fileBuffer = fs.readFileSync(
      `${__dirname}/public/data/${year}/${month}.json`,
    );
    const data = JSON.parse(fileBuffer);
    results = [...results, ...data];
  });

  let data = [];
  if (year === "2020" || year === "2021") {
    const cleanedYearData = cleanWashDoubleCounting(results);
    data = cleanedYearData.filter((item) => !item.activity);
  } else if (year === "2022") {
    data = results.filter((item) => !item.activity);
  } else {
    data = results;
  }
  return data;
}

function getMonthData(year, month) {
  let currentMonth = fs.readFileSync(
    `${__dirname}/public/data/${year}/${month}.json`,
  );

  const data = JSON.parse(currentMonth);
  return data;
}

function getGov(data, months, province) {
  const filteredData = data.filterBy("province", province);
  const governmentData = groupElementsByFunc(
    filteredData,
    "month",
    defaultGrouping,
  ).map((provinceLists) => {
    return { month: provinceLists.name, total: provinceLists.total };
  });
  const govDataWithEmpty = addEmpty(months, governmentData);
  return govDataWithEmpty;
}

function getGen(data, months, gender) {
  const genderData = groupElementsByFunc(data, "month", defaultGrouping).map(
    (gendersLists) => {
      return { month: gendersLists.name, total: gendersLists[gender] };
    },
  );
  const genderDataWithEmpty = addEmpty(months, genderData);
  return genderDataWithEmpty;
}

function getDist(data) {
  const rest = (prop, item) => {
    const uniqueLocations = groupElementsByFunc(
      item,
      "location",
      defaultGrouping,
    );
    const uniqueTypes = groupElementsByFunc(
      item,
      "typeOfBeneficiaries",
      defaultGrouping,
    );

    return {
      name: item[0][prop],
      idps: uniqueTypes
        .filter((item) => item.name === "IDPs")
        .map((item) => item.total)
        .sum(),
      refugees: uniqueTypes
        .filter((item) => item.name === "Refugee")
        .map((item) => item.total)
        .sum(),
      returnees: uniqueTypes
        .filter((item) => item.name === "Returnees")
        .map((item) => item.total)
        .sum(),
      host: uniqueTypes
        .filter((item) => item.name === "Host Community")
        .map((item) => item.total)
        .sum(),
      camp: uniqueLocations
        .filter((item) => item.name === "Camp")
        .map((item) => item.total)
        .sum(),
      urban: uniqueLocations
        .filter((item) => item.name === "NonCamp")
        .map((item) => item.total)
        .sum(),
      male: uniqueLocations.map((item) => item.male).sum(),
      female: uniqueLocations.map((item) => item.female).sum(),
      total: item.map((ad) => ad.total).sum(),
    };
  };

  const uniqueDistricts = groupElementsByFunc(data, "district", rest).sort(
    sortDistricts,
  );
  return uniqueDistricts;
}

function getMonths(year) {
  const months = fs.readdirSync(`${__dirname}/public/data/${year}`);
  const sortedMonths = sortByMonthName(months);
  const results = sortedMonths.map((month) => {
    return month.split(".")[0];
  });
  return results;
}

function getMonthsNew(year, projectName) {
  const months = getYearData(year)
    .filter((item) => item.nameOfProject === projectName)
    .map((item) => item.month);
  const uniqueMonths = [...new Set(months)];
  const sortedMonths = sortByMonthName(uniqueMonths);

  return sortedMonths;
}

function getProjects(data, year, month) {
  const projects = data.map((item) => item.nameOfProject);
  const uniqueProjects = [...new Set(projects)];

  return {
    year,
    month,
    projects: uniqueProjects,
  };
}

function getBeneficiaries(data) {
  const beneficiaries = data.map((ad) => {
    return {
      bens: ad.typeOfBeneficiaries,
      male: ad.male,
      female: ad.female,
      location: ad.location,
      total: ad.total,
    };
  });
  return groupElementsByFunc(beneficiaries, "bens", (prop, item) => {
    return {
      name: item[0][prop],
      male: item
        .filter((ad) => ad.male)
        .map((ad) => ad.male)
        .sum(),
      female: item
        .filter((ad) => ad.female)
        .map((ad) => ad.female)
        .sum(),
      urban: item
        .filter((ad) => ad.location == "NonCamp")
        .map((ad) => ad.total)
        .sum(),
      camp: item
        .filter((ad) => ad.location == "Camp")
        .map((ad) => ad.total)
        .sum(),
      total: item.map((ad) => ad.total).sum(),
    };
  });
}

function getActivities(data) {
  const activities = data.map((ad) => {
    return {
      act: ad.activity,
      nameOfProject: ad.nameOfProject,
      male: ad.male,
      female: ad.female,
      total: ad.total,
    };
  });
  return groupElementsByFunc(activities, "act", (prop, item) => {
    return {
      name: item[0][prop],
      nameOfProject: item
        .filter((ad) => ad.nameOfProject)
        .map((item) => item.nameOfProject)[0],
      male: item
        .filter((ad) => ad.male)
        .map((ad) => ad.male)
        .sum(),
      female: item
        .filter((ad) => ad.female)
        .map((ad) => ad.female)
        .sum(),
      total: item.map((ad) => ad.total).sum(),
    };
  });
}

function getGender(data, year) {
  return {
    male: getGen(data, getMonths(year), "male", ""),
    female: getGen(data, getMonths(year), "female", ""),
  };
}

function getGovernorates(data, year) {
  return {
    duhok: getGov(data, getMonths(year), "Duhok", ""),
    nineveh: getGov(data, getMonths(year), "Nineveh", ""),
    erbil: getGov(data, getMonths(year), "Erbil", ""),
  };
}

function getGeneralData(data, year, month) {
  const uniqueBeneficiaries = getBeneficiaries(data);

  const uniqueActivities = getActivities(data);

  return {
    year: year,
    month: month ? month : null,
    beneficiaries: uniqueBeneficiaries,
    districts: getDist(data),
    gender: month ? null : getGender(data, year),
    gov: month ? null : getGovernorates(data, year),
    activities: month ? uniqueActivities : null,
    male: data
      .filter((ad) => ad.male)
      .map((ad) => ad.male)
      .sum(),
    female: data
      .filter((ad) => ad.female)
      .map((ad) => ad.female)
      .sum(),
    urban: data
      .filter((ad) => ad.location === "NonCamp")
      .map((ad) => ad.total)
      .sum(),
    camp: data
      .filter((ad) => ad.location === "Camp")
      .map((ad) => ad.total)
      .sum(),
    total: data.map((ad) => ad.total).sum(),
  };
}

function projectAndComponentGroupings(prop, item, year, month) {
  const uniqueActivities = getActivities(item);
  const uniqueBeneficiaries = getBeneficiaries(item);

  return {
    nameOfProject: item.map((ad) => ad.nameOfProject)[0],
    name: item[0][prop],
    year: year,
    month: month ? month : null,
    months: getMonthsNew(year, item.map((ad) => ad.nameOfProject)[0]),
    clusters: [...new Set(item.map((ad) => ad.cluster))],
    objectives: [...new Set(item.map((ad) => ad.objective))],
    beneficiaries: uniqueBeneficiaries,
    activities: year < 2023 ? null : uniqueActivities,
    districts: getDist(item),
    gender: month ? null : getGender(item, year),
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
}

function getProjectsData(data, year, month) {
  const grouping = (prop, item) => {
    return projectAndComponentGroupings(prop, item, year, month);
  };

  const uniqueProjects = groupElementsByFunc(data, "nameOfProject", grouping);
  return uniqueProjects;
}

function getProjectComponentsData(data, year, month) {
  const grouping = (prop, item) => {
    return projectAndComponentGroupings(prop, item, year, month);
  };

  const uniqueComponents = groupElementsByFunc(data, "Component", grouping)
    .filter((item) => !!item.name)
    .groupBy("nameOfProject");
  return uniqueComponents;
}

export {
  getYearData,
  getMonthData,
  getMonths,
  getProjectsData,
  getGeneralData,
  getProjectComponentsData,
  getProjects,
};
