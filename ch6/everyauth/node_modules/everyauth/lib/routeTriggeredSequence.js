var StepSequence = require('./stepSequence');

module.exports = RouteTriggeredSequence;

function RouteTriggeredSequence (name, _module) {
  StepSequence.call(this, name, _module);
}

require('util').inherits(RouteTriggeredSequence, StepSequence);

RouteTriggeredSequence.prototype.routeHandler = function (req, res, next) {
  // Create a shallow clone, so that seq.values are different per HTTP request
  var seq = this.materialize();
  // Overwrite module errback with connect's next
  seq.module.moduleErrback(next);
  // Kicks off a sequence of steps based on a route
  seq.start(req, res, next); // BOOM!
};
