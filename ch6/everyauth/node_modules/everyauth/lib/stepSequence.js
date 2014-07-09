var Promise = require('./promise');
var clone = require('./utils').clone;

module.exports = StepSequence;

function StepSequence (name, module) {
  this.name = name;
  this.module = module;
  this.orderedStepNames = [];
}

StepSequence.prototype.isSeq = true;

/**
 * Sets up the immediate or eventual output of priorPromise to pipe to the
 * nextStep's promise
 * @param {Promise} priorPromise
 * @param {Step} nextStep
 * @returns {Promise}
 */
StepSequence.prototype._bind = function (priorPromise, nextStep) {
  var nextPromise = new Promise();
  var seq = this;

  priorPromise.callback( function () {
    var resultPromise = nextStep.exec(seq);
    if (!resultPromise) return; // if we have a breakTo
    resultPromise.callback( function () {
      nextPromise.fulfill();
    }); // TODO breakback?
  });
  return nextPromise;
};

/**
 * This kicks off a sequence of steps.
 * Creates a new chain of promises and exposes the leading promise
 * to the incoming (req, res) pair from the route handler
 */
StepSequence.prototype.start = function () {
  var steps = this.steps;

  this._transposeArgs(arguments);

  // Pipe through the steps
  var priorStepPromise = steps[0].exec(this);

  // If we have a breakTo
  if (!priorStepPromise) return;

  for (var i = 1, l = steps.length; i < l; i++) {
    priorStepPromise = this._bind(priorStepPromise, steps[i]);
  }
  return priorStepPromise;
};

// Used for exposing the leading promise of a step promise chain to the
// incoming args (e.g., [req, res] pair from the route handler)
StepSequence.prototype._transposeArgs = function (args) {
  var seq = this;
  this.steps[0].accepts.forEach( function (paramName, i) {
    // Map the incoming arguments to the named parameters 
    // that the first step is expected to accept.
    seq.values[paramName] = args[i];
  });
};

StepSequence.prototype.clone = function (submodule) {
  var sequence = new (this.constructor)(this.name, submodule);
  sequence.orderedStepNames = clone(this.orderedStepNames);
  return sequence;
};

StepSequence.prototype._propertiesToMaterialize = ['isSeq', '_bind', 'start', '_transposeArgs'];

StepSequence.prototype.materialize = function () {
  var sequence = Object.create(this)
    , materializedMethods = this._propertiesToMaterialize;
  sequence.values = {};
  for (var i = materializedMethods.length; i--;) {
    var methodName = materializedMethods[i];
    sequence[methodName] = this[methodName];
  }
  return sequence;
};

// TODO Replace logic here with newer introspection code
StepSequence.prototype.validateSteps = function () {
  var steps = this.steps
    , step
    , paramsToDate = []
    , missingParams;
  for (var i = 0, l = steps.length; i < l; i++) {
    step = steps[i];
    if ('undefined' === typeof step.accepts)
      throw new Error('You did not declare accepts for the step: ' + step.name);
    if ('undefined' === typeof step.promises)
      throw new Error('You did not declare promises for the step: ' + step.name);

    if (i === 0) 
      paramsToDate = paramsToDate.concat(step.accepts);

    missingParams = step.accepts.filter( function (param) {
      return paramsToDate.indexOf(param) === -1;
    });

    if (i > 0 && missingParams.length)
      throw new Error('At step, ' + step.name + ', you are trying to access the parameters: ' +
        missingParams.join(', ') + ' . However, only the following parameters have been ' +
        'promised from prior steps thus far: ' + paramsToDate.join(', '));

    paramsToDate = paramsToDate.concat(step.promises);

    if ('undefined' === typeof this.module[step.name]())
      // TODO Remove this Error, since invoking the arg to typeof (see line above)
      //      already throws an Error
      throw new Error('No one defined the function for the following step: ' + step.name + ' in the module ' + this.module.name);
  }
};

Object.defineProperty(StepSequence.prototype, 'steps', {
  get: function () {
    // Compile the steps by pulling the step names from the module
    var allSteps = this.module._steps
      , orderedSteps = this.orderedStepNames.map( function (stepName) {
          return allSteps[stepName];
        })
      , seq = this;

    function compileSteps () {
      var paramsToDate = []
        , missingParams;

      var steps = orderedSteps.map( function (step, i) {
        var meta = { missing: [], step: step, missingParams: [], paramsToDate: {} };
        if (! ('promises' in step)) {
          meta.missing.push('promises');
        }
        if (! ('accepts' in step)) {
          meta.missing.push('accepts');
        }

        if (('accepts' in step) && i === 0)
          paramsToDate = paramsToDate.concat(step.accepts);

        missingParams = !step.accepts ? [] : step.accepts.filter( function (param) {
          return paramsToDate.indexOf(param) === -1;
        });

        if (step.promises)
          paramsToDate = paramsToDate.concat(step.promises);

        if (missingParams.length) {
          meta.missingParams = missingParams;
          meta.paramsToDate = paramsToDate;
        }

        if (! (('_' + step.name) in seq.module))
          meta.missing.push('its function');

        return meta;
      });

      return steps;
    }

    var compiledSteps;

    Object.defineProperty(orderedSteps, 'incomplete', { get: function () {
      compiledSteps || (compiledSteps = compileSteps());
      return compiledSteps.filter( function (stepMeta) {
        return stepMeta.missing.length > 0;
      }).map( function (stepMeta) {
        var error = 'is missing: ' + stepMeta.missing.join(', ');
        return { name: stepMeta.step.name, error: error };
      });
    } });

    Object.defineProperty(orderedSteps, 'invalid', { get: function () {
      compiledSteps || (compiledSteps = compileSteps());
      return compiledSteps.filter( function (stepMeta) {
        return stepMeta.missingParams.length > 0;
      }).map( function (stepMeta) {
        var error = 'is trying to accept the parameters: ' + 
                  stepMeta.missingParams.join(', ') + 
                  ' . However, only the following parameters have ' + 
                  'been promised from prior steps thus far: ' + 
                  stepMeta.paramsToDate.join(', ');
        return { name: stepMeta.step.name, error: error };
      });
    } });

    return orderedSteps;
  }
});

Object.defineProperty(StepSequence.prototype, 'debug', {
  get: function () { return this.module.everyauth.debug; }
});
