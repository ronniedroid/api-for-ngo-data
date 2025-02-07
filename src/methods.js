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

  function toPartitions ( size ) {
    var partition = [];
    return function ( acc, v ) {
        partition.push( v );
        if ( partition.length === size ) {
            acc.push( partition );
            partition = [];
        }
        return acc;
    };
}

Array.prototype.partition = function ( size ) {
    return this.reduce( toPartitions( size ), [] );
}