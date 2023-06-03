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
  
  Array.prototype.filterBy = function (control, compair) {
    return this.filter((item) => item[control] === compair);
  };