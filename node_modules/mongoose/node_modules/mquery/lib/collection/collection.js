'use strict';

/**
 * methods a collection must implement
 */

var names = 'find findOne update remove count distict findAndModify aggregate';
var methods = names.split(' ');

/**
 * Collection base class from which implementations inherit
 */

function Collection () {}

for (var i = 0, len = methods.length; i < len; ++i) {
  var method = methods[i];
  Collection.prototype[method] = notImplemented(method);
}

module.exports = exports = Collection;
Collection.methods = methods;

/**
 * creates a function which throws an implementation error
 */

function notImplemented (method) {
  return function () {
    throw new Error('collection.' + method + ' not implemented');
  }
}

