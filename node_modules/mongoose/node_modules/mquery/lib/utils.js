'use strict';

/*!
 * Module dependencies.
 */

var mongodb = require('mongodb')
  , ReadPref = mongodb.ReadPreference
  , ObjectId = mongodb.ObjectID
  , RegExpClone = require('regexp-clone')

/**
 * Object clone with Mongoose natives support.
 *
 * Creates a minimal data Object.
 * It does not clone empty Arrays, empty Objects, and undefined values.
 * This makes the data payload sent to MongoDB as minimal as possible.
 *
 * @param {Object} obj the object to clone
 * @param {Object} options
 * @return {Object} the cloned object
 * @api private
 */

exports.clone = function clone (obj, options) {
  if (obj === undefined || obj === null)
    return obj;

  if (Array.isArray(obj))
    return exports.cloneArray(obj, options);

  if ('Object' === obj.constructor.name)
    return exports.cloneObject(obj, options);

  if ('Date' === obj.constructor.name || 'Function' === obj.constructor.name)
    return new obj.constructor(+obj);

  if ('RegExp' === obj.constructor.name) {
    return RegExpClone(obj);
  }

  if (obj instanceof ObjectId)
    return new ObjectId(obj.id);

  if (obj.valueOf)
    return obj.valueOf();
};
var clone = exports.clone;

/*!
 * ignore
 */

var cloneObject = exports.cloneObject = function cloneObject (obj, options) {
  var retainKeyOrder = options && options.retainKeyOrder
    , minimize = options && options.minimize
    , ret = {}
    , hasKeys
    , keys
    , val
    , k
    , i

  if (retainKeyOrder) {
    for (k in obj) {
      val = clone(obj[k], options);

      if (!minimize || ('undefined' !== typeof val)) {
        hasKeys || (hasKeys = true);
        ret[k] = val;
      }
    }
  } else {
    // faster

    keys = Object.keys(obj);
    i = keys.length;

    while (i--) {
      k = keys[i];
      val = clone(obj[k], options);

      if (!minimize || ('undefined' !== typeof val)) {
        if (!hasKeys) hasKeys = true;
        ret[k] = val;
      }
    }
  }

  return minimize
    ? hasKeys && ret
    : ret;
};

var cloneArray = exports.cloneArray = function cloneArray (arr, options) {
  var ret = [];
  for (var i = 0, l = arr.length; i < l; i++)
    ret.push(clone(arr[i], options));
  return ret;
};

/**
 * process.nextTick helper.
 *
 * Wraps the given `callback` in a try/catch. If an error is
 * caught it will be thrown on nextTick.
 *
 * node-mongodb-native had a habit of state corruption when
 * an error was immediately thrown from within a collection
 * method (find, update, etc) callback.
 *
 * @param {Function} [callback]
 * @api private
 */

var tick = exports.tick = function tick (callback) {
  if ('function' !== typeof callback) return;
  return function () {
    // callbacks should always be fired on the next
    // turn of the event loop. A side benefit is
    // errors thrown from executing the callback
    // will not cause drivers state to be corrupted
    // which has historically been a problem.
    var args = arguments;
    soon(function(){
      callback.apply(this, args);
    });
  }
}

/**
 * Merges `from` into `to` without overwriting existing properties.
 *
 * @param {Object} to
 * @param {Object} from
 * @api private
 */

var merge = exports.merge = function merge (to, from) {
  var keys = Object.keys(from)
    , i = keys.length
    , key

  while (i--) {
    key = keys[i];
    if ('undefined' === typeof to[key]) {
      to[key] = from[key];
    } else {
      if (exports.isObject(from[key])) {
        merge(to[key], from[key]);
      } else {
        to[key] = from[key];
      }
    }
  }
}

/**
 * Same as merge but clones the assigned values.
 *
 * @param {Object} to
 * @param {Object} from
 * @api private
 */

var mergeClone = exports.mergeClone = function mergeClone (to, from) {
  var keys = Object.keys(from)
    , i = keys.length
    , key

  while (i--) {
    key = keys[i];
    if ('undefined' === typeof to[key]) {
      // make sure to retain key order here because of a bug handling the $each
      // operator in mongodb 2.4.4
      to[key] = clone(from[key], { retainKeyOrder : 1});
    } else {
      if (exports.isObject(from[key])) {
        mergeClone(to[key], from[key]);
      } else {
        // make sure to retain key order here because of a bug handling the
        // $each operator in mongodb 2.4.4
        to[key] = clone(from[key], { retainKeyOrder : 1});
      }
    }
  }
}

/**
 * Read pref helper (mongo 2.2 drivers support this)
 *
 * Allows using aliases instead of full preference names:
 *
 *     p   primary
 *     pp  primaryPreferred
 *     s   secondary
 *     sp  secondaryPreferred
 *     n   nearest
 *
 * @param {String|Array} pref
 * @param {Array} [tags]
 */

exports.readPref = function readPref (pref, tags) {
  if (Array.isArray(pref)) {
    tags = pref[1];
    pref = pref[0];
  }

  switch (pref) {
    case 'p':
      pref = 'primary';
      break;
    case 'pp':
      pref = 'primaryPreferred';
      break;
    case 's':
      pref = 'secondary';
      break;
    case 'sp':
      pref = 'secondaryPreferred';
      break;
    case 'n':
      pref = 'nearest';
      break;
  }

  return new ReadPref(pref, tags);
}

/**
 * Object.prototype.toString.call helper
 */

var toString = Object.prototype.toString;
exports.toString = function (arg) {
  return toString.call(arg);
}

/**
 * Determines if `arg` is an object.
 *
 * @param {Object|Array|String|Function|RegExp|any} arg
 * @return {Boolean}
 */

exports.isObject = function (arg) {
  return '[object Object]' == exports.toString(arg);
}

/**
 * Determines if `arg` is an array.
 *
 * @param {Object}
 * @return {Boolean}
 * @see nodejs utils
 */

exports.isArray = function (arg) {
  return Array.isArray(arg) ||
    'object' == typeof arg && '[object Array]' == exports.toString(arg);
}

/**
 * Object.keys helper
 */

exports.keys = Object.keys || function (obj) {
  var keys = [];
  for (var k in obj) if (obj.hasOwnProperty(k)) {
    keys.push(k);
  }
  return keys;
}

/**
 * Basic Object.create polyfill.
 * Only one argument is supported.
 *
 * Based on https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
 */

exports.create = 'function' == typeof Object.create
  ? Object.create
  : create;

function create (proto) {
  if (arguments.length > 1) {
    throw new Error("Adding properties is not supported")
  }

  function F () {}
  F.prototype = proto;
  return new F;
}

/**
 * inheritance
 */

exports.inherits = function (ctor, superCtor) {
  ctor.prototype = exports.create(superCtor.prototype);
  ctor.prototype.constructor = ctor;
}

/**
 * nextTick helper
 * compat with node 0.10 which behaves differently than previous versions
 */

var soon = exports.soon = 'function' == typeof setImmediate
  ? setImmediate
  : process.nextTick;

/**
 * need to export this for checking issues
 */

exports.mongo = mongodb;
