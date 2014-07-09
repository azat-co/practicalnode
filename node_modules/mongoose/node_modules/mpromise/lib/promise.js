'use strict';

/*!
 * Module dependencies.
 */

var slice = function (arr, start, end) {
  return Array.prototype.slice.call(arr, start, end)
};
var EventEmitter = require('events').EventEmitter;

/**
 * Promise constructor.
 *
 * _NOTE: The success and failure event names can be overridden by setting `Promise.SUCCESS` and `Promise.FAILURE` respectively._
 *
 * @param {Function} back a function that accepts `fn(err, ...){}` as signature
 * @inherits NodeJS EventEmitter http://nodejs.org/api/events.html#events_class_events_eventemitter
 * @event `reject`: Emits when the promise is rejected (event name may be overridden)
 * @event `fulfill`: Emits when the promise is fulfilled (event name may be overridden)
 * @api public
 */

function Promise(back) {
  EventEmitter.call(this);

  this.emitted = {};
  this.ended = false;
  if ('function' == typeof back)
    this.onResolve(back);
}

/*!
 * event names
 */

Promise.SUCCESS = 'fulfill';
Promise.FAILURE = 'reject';

/*!
 * Inherits from EventEmitter.
 */

Promise.prototype.__proto__ = EventEmitter.prototype;

/**
 * Adds `listener` to the `event`.
 *
 * If `event` is either the success or failure event and the event has already been emitted, the`listener` is called immediately and passed the results of the original emitted event.
 *
 * @param {String} event
 * @param {Function} callback
 * @return {Promise} this
 * @api public
 */

Promise.prototype.on = function (event, callback) {
  if (this.emitted[event])
    callback.apply(this, this.emitted[event]);
  else
    EventEmitter.prototype.on.call(this, event, callback);

  return this;
}

/**
 * Keeps track of emitted events to run them on `on`.
 *
 * @api private
 */

Promise.prototype.emit = function (event) {
  // ensures a promise can't be fulfill() or reject() more than once
  var success = this.constructor.SUCCESS;
  var failure = this.constructor.FAILURE;

  if (event == success || event == failure) {
    if (this.emitted[success] || this.emitted[failure]) {
      return this;
    }
    this.emitted[event] = slice(arguments, 1);
  }

  return EventEmitter.prototype.emit.apply(this, arguments);
}

/**
 * Fulfills this promise with passed arguments.
 *
 * If this promise has already been fulfilled or rejected, no action is taken.
 *
 * @api public
 */

Promise.prototype.fulfill = function () {
  var args = slice(arguments);
  return this.emit.apply(this, [this.constructor.SUCCESS].concat(args));
}

/**
 * Rejects this promise with `reason`.
 *
 * If this promise has already been fulfilled or rejected, no action is taken.
 *
 * @api public
 * @param {Object|String} reason
 * @return {Promise} this
 */

Promise.prototype.reject = function (reason) {
  return this.emit(this.constructor.FAILURE, reason);
}

/**
 * Resolves this promise to a rejected state if `err` is passed or
 * fulfilled state if no `err` is passed.
 *
 * @param {Error} [err] error or null
 * @param {Object} [val] value to fulfill the promise with
 * @api public
 */

Promise.prototype.resolve = function (err, val) {
  if (err) return this.reject(err);
  return this.fulfill(val);
}

/**
 * Adds a listener to the SUCCESS event.
 *
 * @return {Promise} this
 * @api public
 */

Promise.prototype.onFulfill = function (fn) {
  if (!fn) return this;
  if ('function' != typeof fn) throw new TypeError("fn should be a function");
  return this.on(this.constructor.SUCCESS, fn);
}

Promise.prototype.hasRejectListeners = function () {
  return this.listeners(this.constructor.FAILURE).length > 0;
};
/**
 * Adds a listener to the FAILURE event.
 *
 * @return {Promise} this
 * @api public
 */

Promise.prototype.onReject = function (fn) {
  if (!fn) return this;
  if ('function' != typeof fn) throw new TypeError("fn should be a function");
  return this.on(this.constructor.FAILURE, fn);
}

/**
 * Adds a single function as a listener to both SUCCESS and FAILURE.
 *
 * It will be executed with traditional node.js argument position:
 * function (err, args...) {}
 *
 * @param {Function} fn
 * @return {Promise} this
 */

Promise.prototype.onResolve = function (fn) {
  if (!fn) return this;
  if ('function' != typeof fn) throw new TypeError("fn should be a function");

  this.on(this.constructor.FAILURE, function (err) {
    fn.apply(this, [err]);
  });

  this.on(this.constructor.SUCCESS, function () {
    var args = slice(arguments);
    fn.apply(this, [null].concat(args));
  });

  return this;
}

/**
 * Creates a new promise and returns it. If `onFulfill` or
 * `onReject` are passed, they are added as SUCCESS/ERROR callbacks
 * to this promise after the next tick.
 *
 * Conforms to [promises/A+](https://github.com/promises-aplus/promises-spec) specification. Read for more detail how to use this method.
 *
 * ####Example:
 *
 *     var p = new Promise;
 *     p.then(function (arg) {
 *       return arg + 1;
 *     }).then(function (arg) {
 *       throw new Error(arg + ' is an error!');
 *     }).then(null, function (err) {
 *       assert.ok(err instanceof Error);
 *       assert.equal('2 is an error', err.message);
 *     });
 *     p.complete(1);
 *
 * @see promises-A+ https://github.com/promises-aplus/promises-spec
 * @param {Function} onFulFill
 * @param {Function} [onReject]
 * @return {Promise} newPromise
 */

Promise.prototype.then = function (onFulfill, onReject) {
  var self = this
    , retPromise = new Promise;

  if ('function' == typeof onReject) {
    self.onReject(handler(retPromise, onReject));
  } else {
    self.onReject(retPromise.reject.bind(retPromise));
  }
  if ('function' == typeof onFulfill) {
    self.onFulfill(handler(retPromise, onFulfill));
  } else {
    self.onFulfill(retPromise.fulfill.bind(retPromise));
  }

  return retPromise;
};


function handler(retPromise, fn) {
  return function handler() {
    var args = arguments;
    process.nextTick(
      function in_the_handler() {
        if (retPromise.domain && retPromise.domain !== process.domain) retPromise.domain.enter();
        var x;

        try {
          x = fn.apply(undefined, args);
        } catch (err) {
          if (retPromise.ended && !retPromise.hasRejectListeners()) throw err;
          return retPromise.reject(err);
        }

        resolve(retPromise, x);
        return;
      }
    );
  }
}

function resolve(promise, x) {
  var then;
  var type;
  var done;
  var reject_;
  var resolve_;

  type = typeof x;
  if ('undefined' == type) {
    return promise.fulfill(x);
  }

  if (promise === x) {
    return promise.reject(new TypeError("promise and x are the same"));
  }

  if (null != x) {

    if ('object' == type || 'function' == type) {
      try {
        then = x.then;
      } catch (err) {
        if (promise.ended && !promise.hasRejectListeners()) throw err;
        return promise.reject(err);
      }

      if ('function' == typeof then) {
        try {
          resolve_ = function () {var args = slice(arguments); resolve.apply(this, [promise].concat(args));};
          reject_ = promise.reject.bind(promise);
          done = false;
          return then.call(
            x
            , function fulfill() {
              if (done) return;
              done = true;
              return resolve_.apply(this, arguments);
            }
            , function reject() {
              if (done) return;
              done = true;
              return reject_.apply(this, arguments);
            })
        } catch (err) {
          if (done) return;
          done = true;
          if (promise.ended) throw err;
          return promise.reject(err);
        }
      }
    }
  }

  promise.fulfill(x);
}

/**
 * Signifies that this promise was the last in a chain of `then()s`: if a handler passed to the call to `then` which produced this promise throws, the exception will go uncaught.
 *
 * ####Example:
 *
 *     var p = new Promise;
 *     p.then(function(){ throw new Error('shucks') });
 *     setTimeout(function () {
 *       p.fulfill();
 *       // error was caught and swallowed by the promise returned from
 *       // p.then(). we either have to always register handlers on
 *       // the returned promises or we can do the following...
 *     }, 10);
 *
 *     // this time we use .end() which prevents catching thrown errors
 *     var p = new Promise;
 *     var p2 = p.then(function(){ throw new Error('shucks') }).end(); // <--
 *     setTimeout(function () {
 *       p.fulfill(); // throws "shucks"
 *     }, 10);
 *
 * @api public
 * @param {Function} [onReject]
 * @return {Promise} this
 */

Promise.prototype.end = function (onReject) {
  this.onReject(onReject);
  this.ended = true;
  return this;
};

module.exports = Promise;
