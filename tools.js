const fs = require('fs');

module.exports = {
  sortByMonthName: function (monthNames, isReverse = false) {
    const referenceMonthNames = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
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
      .map((month) => month.split('.')[0]);

    months = this.sortByMonthName(months);

    let results = [];
    months.map((month) => {
      const fileBuffer = fs.readFileSync(`./data/${year}/${month}.json`);
      const data = JSON.parse(fileBuffer);
      const arr = Array.from(Object.values(data));
      arr.map((item) => {
        item.map((i) => {
          results = [...results, i];
        });
      });
    });
    return results;
  },
  cleanWashDoubleCounting: function (yearData) {
    const adjustedYearData = yearData.filter((item) => {
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
      ...new Set(yearData.filter((x) => !adjustedYearData.includes(x))),
    ];
    return finalData;
  },
};
