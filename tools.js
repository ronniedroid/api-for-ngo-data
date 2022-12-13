const fs = require("fs");

Array.prototype.sum = function () {
  return this.reduce((a, b) => a + b, 0);
};

Array.prototype.zipWith = function (...props) {
  const array = [[...this], ...props];
  const fn =
    typeof array[array.length - 1] === "function" ? array.pop() : undefined;
  return Array.from(
    { length: Math.max(...array.map((a) => a.length)) },
    (_, i) => (fn ? fn(...array.map((a) => a[i])) : array.map((a) => a[i]))
  );
};

Array.prototype.groupBy = function (prop) {
  return this.reduce(function (groups, item) {
    const val = item[prop];
    groups[val] = groups[val] || [];
    groups[val].push(item);
    return groups;
  }, {});
};

function sortDistricts(a, b) {
  let fa = a.name.toLowerCase(),
    fb = b.name.toLowerCase();

  if (fa < fb) {
    return -1;
  }
  if (fa > fb) {
    return 1;
  }
  return 0;
}

function filterByCluster(data, control, compair) {
  const filteredData = data.filter((item) => item[control] === compair);
  return filteredData;
}

function groupElements(list, prop) {
  const groupings = list.groupBy(prop);
  const arrayFromGroupings = Object.values(groupings);

  return arrayFromGroupings.map((item) => {
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
      total: item.map((ad) => ad.total).sum(),
    };
  });
}

function groupActivities(list, prop) {
  const groupings = list.groupBy(prop);
  const arrayFromGroupings = Object.values(groupings);

  return arrayFromGroupings.map((item) => {
    return {
      name: item[0][prop],
      cluster: item.map((ad) => ad.cluster)[0],
      typeOfBen: item.map((ad) => ad.typeOfBeneficiaries)[0],
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

function addEmpty(months, series) {
  const monthsWithTotal = months.map((item) => {
    return { month: item, total: 0 };
  });
  const availableMonths = series;
  const combined = [...monthsWithTotal, ...availableMonths];
  return groupElements(combined, "month").map((item) => {
    return { month: item.name, total: item.total };
  });
}

module.exports = {
  cleanWashDoubleCounting: function (yearData) {
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
  },
  getYearData: function (year) {
    let months = fs
      .readdirSync(`./data/${year}`)
      .map((month) => month.split(".")[0]);

    months = sortByMonthName(months);

    let results = [];
    months.map((month) => {
      const fileBuffer = fs.readFileSync(`./data/${year}/${month}.json`);
      const data = JSON.parse(fileBuffer);
      results = [...results, ...data];
    });
    return results;
  },

  getMonthData: function (year, month) {
    let currentMonth = fs.readFileSync(`./data/${year}/${month}.json`);

    const data = JSON.parse(currentMonth);
    return data;
  },
  getCurrentDate: function () {
    return new Date().toISOString().split("T")[0];
  },
  getBens: (data, ben, cluster) => {
    const beneficiaries = cluster
      ? filterByCluster(data, "cluster", cluster)
          .filter((item) => item[ben])
          .map((item) => item[ben])
          .sum()
      : data
          .filter((item) => item[ben])
          .map((item) => item[ben])
          .sum();
    return beneficiaries;
  },
  getLocs: (data, loc, cluster) => {
    const location = cluster
      ? filterByCluster(data, "cluster", cluster)
          .filter((item) => item.location === loc)
          .map((item) => item.total)
          .sum()
      : data
          .filter((item) => item.location === loc)
          .map((item) => item.total)
          .sum();
    return location;
  },
  getTypes: (data, type, cluster) => {
    const types = cluster
      ? filterByCluster(data, "cluster", cluster)
          .filter((item) => item.typeOfBeneficiaries === type)
          .map((item) => item.total)
          .sum()
      : data
          .filter((item) => item.typeOfBeneficiaries === type)
          .map((item) => item.total)
          .sum();
    return types;
  },
  getMonths: (year) => {
    const months = fs.readdirSync(`./data/${year}`);
    const sortedMonths = sortByMonthName(months);
    const results = sortedMonths.map((month) => {
      return month.split(".")[0];
    });
    return results;
  },
  getGov: (data, months, province, cluster) => {
    const filteredData = cluster
      ? filterByCluster(data, "cluster", cluster).filter(
          (item) => item.province === province
        )
      : data.filter((item) => item.province === province);
    const governmentData = groupElements(filteredData, "month").map(
      (provinceLists) => {
        return { month: provinceLists.name, total: provinceLists.total };
      }
    );
    const govDataWithEmpty = addEmpty(months, governmentData);
    return govDataWithEmpty;
  },
  getGen: (data, months, gender, cluster) => {
    const filteredMonths = cluster
      ? filterByCluster(data, "cluster", cluster)
      : data;
    const genderData = groupElements(filteredMonths, "month").map(
      (gendersLists) => {
        return { month: gendersLists.name, total: gendersLists[gender] };
      }
    );
    const genderDataWithEmpty = addEmpty(months, genderData);
    return genderDataWithEmpty;
  },
  getDist: (data, cluster) => {
    const filteredData = cluster
      ? filterByCluster(data, "cluster", cluster)
      : data;
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
  },
  getProjectsData: (data) => {
    const uniqueProjects = groupElements(data, "nameOfProject");
    return uniqueProjects;
  },
  getClusters: (data) => {
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
  },
  getActivities: (data, cluster) => {
    const filteredActivities = cluster
      ? filterByCluster(data, "cluster", cluster)
      : data;
    const nameGroupedActivities = groupActivities(
      filteredActivities,
      "activity"
    );
    return nameGroupedActivities;
  },
};
