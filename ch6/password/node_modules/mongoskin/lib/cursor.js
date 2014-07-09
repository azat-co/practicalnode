/*!
 * mongoskin - cursor.js
 *
 * Copyright(c) 2011 - 2012 kissjs.org
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var Cursor = require('mongodb').Cursor;
var utils = require('./utils');

var SkinCursor = exports.SkinCursor = utils.makeSkinClass(Cursor);

/**
 * Retrieve mongodb.Cursor instance.
 * 
 * @param {Function(err, cursor)} callback
 * @return {SkinCursor} this
 * @api public
 */
SkinCursor.prototype._open = function (callback) {
  var self = this;
  this._skin_collection.open(function (err, collection) {
      if (err) return callback(err);
      var args = self._find_args.concat([callback]);
      collection.find.apply(collection, args);
  });
};
