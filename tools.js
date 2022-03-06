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

module.exports = {
  filterByCluster: function (data, control, compair) {
    const filteredData =
      control && compair
        ? data.filter((item) => item[control] === compair)
        : data;
    return filteredData;
  },

  GroupElements: function (list, prop) {
    const groupings = list.groupBy(prop);
    const arrayFromGroupings = Object.values(groupings);

    return arrayFromGroupings.map((item) => {
      return {
        name: item[0][prop],
        male: item.map((ad) => ad.male).sum(),
        female: item.map((ad) => ad.female).sum(),
        total: item.map((ad) => ad.total).sum(),
      };
    });
  },

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

  sortDistricts: function (a, b) {
    let fa = a.name.toLowerCase(),
      fb = b.name.toLowerCase();

    if (fa < fb) {
      return -1;
    }
    if (fa > fb) {
      return 1;
    }
    return 0;
  },
  sortByMonthName: function (monthNames, isReverse = false) {
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
  },
  getYearData: function (year) {
    let months = fs
      .readdirSync(`./data/${year}`)
      .map((month) => month.split(".")[0]);

    months = this.sortByMonthName(months);

    let results = [];
    months.map((month) => {
      const fileBuffer = fs.readFileSync(`./data/${year}/${month}.json`);
      const data = JSON.parse(fileBuffer);
      const arr = Array.from(Object.values(data));
      arr.map((item) => {
        item.map((i) => {
          if (i.nameOfProject && i.total > 0) {
            i.year = year;
            results = [...results, i];
          }
        });
      });
    });
    return results;
  },
  getMonthData: function (year, month) {
    let currentMonth = fs.readFileSync(`./data/${year}/${month}.json`);

    let results = [];
    const data = JSON.parse(currentMonth);
    const arr = Array.from(Object.values(data));
    arr.map((item) => {
      item.map((i) => {
        if (i.total > 0) {
          i.year = year;
          results = [...results, i];
        }
      });
    });
    return results;
  },
};
