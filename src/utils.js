export function sortDistricts(a, b) {
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
  
  export function groupElements(list, prop) {
    const groupings = list.groupBy(prop);
    const arrayFromGroupings = Object.values(groupings);
  
    return arrayFromGroupings.map((item) => {
      return {
        nameOfProject: item.map((ad) => ad.nameOfProject)[0],
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
  
  export function sortByMonthName(monthNames, isReverse = false) {
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
  
  export function addEmpty(months, series) {
    const monthsWithTotal = months.map((item) => {
      return { month: item, total: 0 };
    });
    const availableMonths = series;
    const combined = [...monthsWithTotal, ...availableMonths];
    return groupElements(combined, "month").map((item) => {
      return { month: item.name, total: item.total };
    });
  }