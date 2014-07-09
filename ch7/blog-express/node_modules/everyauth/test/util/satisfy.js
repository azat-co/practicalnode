var satisfy = require('satisfy')
  , Satisfaction = satisfy.Satisfaction;

var _fill = Satisfaction.prototype.fill;
Satisfaction.prototype.fill = function () {
  if (arguments.length === 1) {
    var namesToVals = arguments[0];
    for (var name in namesToVals) {
      _fill.call(this, 'input[name="' + name + '"]', namesToVals[name]);
    }
    return this;
  }
  if (arguments.length === 2) {
    if ('string' === typeof arguments[1]) {
      return _fill.apply(this, arguments);
    }
    var formSelector = this._currFormSelector = arguments[0]
      , namesToVals = arguments[1];
    for (var name in namesToVals) {
      this.fill(formSelector + ' input[name="' + name + '"]', namesToVals[name]);
    }
    return this;
  }
  throw new Error("Unsupported function signature for Satisfaction.prototype.fill");
};

Satisfaction.prototype.submit = function submit () {
  var submitSelector = ''
    , currFormSelector = this._currFormSelector;
  if (currFormSelector) {
    submitSelector += currFormSelector + ' ';
  }
  submitSelector += 'input[type=submit]';
  return this.click(submitSelector);
}

var _expect = Satisfaction.prototype.expect;
Satisfaction.prototype.expect = function (selector) {
  return new Assertion(selector, this);
};

var flags = {
    not: ['to', 'have']
  , to: ['not', 'have']
  , have: []
};

function Assertion (selector, satisfaction, flag, parent) {
  this.selector = selector;
  this.satisfaction = satisfaction;

  if (flag == 'not') {
    this.onComplete = function () {
      this.selector = ':not(' + this.selector + ')';
    }
  }

  this.flags = {};

  if (undefined != parent) {
    this.flags[flag] = true;
    for (var i in parent.flags) if (parent.flags.hasOwnProperty(i)) {
      this.flags[i] = true;
    }
    if (parent.onComplete) this.onComplete = parent.onComplete;
  }

  var $flags = flag ? flags[flag] : Object.keys(flags)
    , self = this;

  for (var i = $flags.length; i--; ) {
    // avoid recursion
    if (this.flags[$flags[i]]) continue;

    var name = $flags[i]
      , assertion = new Assertion(this.selector, this.satisfaction, name, this);

    this[name] = assertion;
  }
}

Assertion.prototype.text = function (str) {
  this.selector += ':contains(' + str + ')'
  return this
};

// Delegate any methods with satisfaction method names back to satisfaction

var satisfyMethodNames = ['run', 'fill', 'expect', 'click', 'submit'];
for (var i = satisfyMethodNames.length; i--; ) {
  var name = satisfyMethodNames[i];
  (function (name) {
    Assertion.prototype[name] = function () {
      if (this.onComplete) this.onComplete();
      console.log(this.selector);
      _expect.call(this.satisfaction, this.selector);
      return this.satisfaction[name].apply(this.satisfaction, arguments);
    };
  })(name);
}

module.exports = satisfy;
