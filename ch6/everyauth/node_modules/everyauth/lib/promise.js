var Promise = function (values) {
  this._callbacks = [];
  this._errbacks = [];
  this._timebacks = [];
  if (arguments.length > 0) {
    this.fulfill.apply(this, values);
  }
};

Promise.prototype.callback = function (fn, scope) {
  if (this.values) {
    fn.apply(scope, this.values);
    return this;
  }
  this._callbacks.push([fn, scope]);
  return this;
};

Promise.prototype.errback = function (fn, scope) {
  if (this.err) {
    fn.call(scope, this.err);
    return this;
  }
  this._errbacks.push([fn, scope]);
  return this;
};

Promise.prototype.timeback = function (fn, scope) {
  if (this.timedOut) {
    fn.call(scope);
    return this;
  }
  this._timebacks.push([fn, scope]);
  return this;
};

Promise.prototype.fulfill = function () {
  if (this.isFulfilled || this.err || this.timedOut) return;
  this.isFulfilled = true;
  if (this._timeout) clearTimeout(this._timeout);
  var callbacks = this._callbacks;
  this.values = arguments;
  for (var i = 0, l = callbacks.length; i < l; i++) {
    callbacks[i][0].apply(callbacks[i][1], arguments);
  }
  return this;
};

Promise.prototype.fail = function (err) {
  if (this._timeout) clearTimeout(this._timeout);
  var errbacks = this._errbacks;
  if ('string' === typeof err)
    err = new Error(err);
  this.err = err;
  for (var i = 0, l = errbacks.length; i < l; i++) {
    errbacks[i][0].call(errbacks[i][1], err);
  }
  return this;
};

Promise.prototype.timeout = function (ms) {
  if (this.values || this.err) return this;
  var timebacks = this._timebacks
    , self = this;
  if (ms === -1) return this;
  this._timeout = setTimeout(function () {
    self.timedOut = true;
    for (var i = 0, l = timebacks.length; i < l; i++) {
      timebacks[i][0].call(timebacks[i][1]);
    }
  },  ms);
  return this;
};

var ModulePromise = module.exports = function (_module, values) {
  if (values)
    Promise.call(this, values);
  else
    Promise.call(this);
  this.module = _module;
};

ModulePromise.prototype.__proto__ = Promise.prototype;

ModulePromise.prototype.breakTo = function (seqName) {
  if (this._timeout) clearTimeout(this._timeout);

  var args = Array.prototype.slice.call(arguments, 1);
  var _module = this.module
    , seq = _module._stepSequences[seqName];
  if (_module.everyauth.debug)
    console.log('breaking out to ' + seq.name);
  seq = seq.materialize();
  seq.start.apply(seq, args);
  // TODO Garbage collect the abandoned sequence
};
