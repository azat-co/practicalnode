(function() {
  var factorial;

  factorial = function(x) {
    if (x === 1) {
      return 1;
    }
    return x * factorial(x - 1);
  };

  window.factorial = factorial;

}).call(this);

(function() {
  var Car;

  Car = (function() {
    function Car() {}

    Car.prototype._setType = function(type) {
      if (type == null) {
        type = 'compact';
      }
      return this.type = type;
    };

    Car.prototype.echoType = function() {
      return console.log(toyota.type);
    };

    return Car;

  })();

  window.Car = Car;

}).call(this);
