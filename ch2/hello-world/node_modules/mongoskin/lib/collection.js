/*!
 * mongoskin - collection.js
 *
 * Copyright(c) 2011 - 2012 kissjs.org
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */
var __slice = Array.prototype.slice;
var Collection = require('mongodb').Collection;
var SkinCursor = require('./cursor').SkinCursor;
var helper = require('./helper');
var utils = require('./utils');

/**
 * Constructor
 */
var SkinCollection = exports.SkinCollection = utils.makeSkinClass(Collection);

/**
 * bind extend functions to collection
 *
 * e.g.
 *
 * db.bind('article').bind({
 *   getPostByAuthor: function(id, callback) {
 *      this.findOne({author_id: id}, callback);
 *   }
 * });
 *
 */
SkinCollection.prototype.bind = function(extendObject) {
  for(var key in extendObject) {
    if(typeof extendObject[key] == 'function') {
      this[key] = extendObject[key].bind(this);
    } else {
      this[key] = extendObject[key];
    }
  }
}

SkinCollection.prototype._open = function(callback) {
  var collection_args = this._collection_args.concat([callback]);
  this._skin_db.open(function(err, db) {
      if(err) return callback(err);
      db.collection.apply(db, collection_args);
  });
}

/*
 * find is a special method, because it could return a SkinCursor instance
 */
SkinCollection.prototype._find = SkinCollection.prototype.find;

/**
 * same args as find, but use Array as callback result but not use Cursor
 *
 * findItems(args, function (err, items) {});
 *
 * same as
 *
 * find(args).toArray(function (err, items) {});
 * 
 * or using `mongodb.collection.find()`
 *
 * find(args, function (err, cursor) {
 *   cursor.toArray(function (err, items) {
 *   });
 * });
 *
 * @param {Object} [query]
 * @param {Object} [options]
 * @param {Function(err, docs)} callback
 * @return {SkinCollection} this
 * @api public
 */
SkinCollection.prototype.findItems = function (query, options, callback) {
  var args = __slice.call(arguments);
  var fn = args[args.length - 1];
  args[args.length - 1] = function (err, cursor) {
    if (err) {
      return fn(err);
    }
    cursor.toArray(fn);
  };
  this.find.apply(this, args);
  return this;
};

/**
 * find and cursor.each(fn).
 * 
 * @param {Object} [query]
 * @param {Object} [options]
 * @param {Function(err, item)} eachCallback
 * @return {SkinCollection} this
 * @api public
 */
SkinCollection.prototype.findEach = function (query, options, eachCallback) {
  var args = __slice.call(arguments);
  var fn = args[args.length - 1];
  args[args.length - 1] = function (err, cursor) {
    if (err) {
      return fn(err);
    }
    cursor.each(fn);
  };
  this.find.apply(this, args);
  return this;
};

/**
 * Operate by object.`_id`
 * 
 * @param {String} methodName
 * @param {String|ObjectID|Number} id
 * @param {Arguments|Array} args
 * @return {SkinCollection} this
 * @api private
 */
SkinCollection.prototype._operateById = function (methodName, id, args) {
  args = __slice.call(args);
  args[0] = {_id: helper.toObjectID(id)};
  this[methodName].apply(this, args);
  return this;
};

/**
 * Find one object by _id.
 * 
 * @param {String|ObjectID|Number} id, doc primary key `_id`
 * @param {Function(err, doc)} callback
 * @return {SkinCollection} this
 * @api public
 */
SkinCollection.prototype.findById = function (id, callback) {
  return this._operateById('findOne', id, arguments);
};

/**
 * Update doc by _id.
 * @param {String|ObjectID|Number} id, doc primary key `_id`
 * @param {Object} doc
 * @param {Function(err)} callback
 * @return {SkinCollection} this
 * @api public
 */
SkinCollection.prototype.updateById = function (id, doc, callback) {
  return this._operateById('update', id, arguments);
};

/**
 * Remove doc by _id.
 * @param {String|ObjectID|Number} id, doc primary key `_id`
 * @param {Function(err)} callback
 * @return {SkinCollection} this
 * @api public
 */
SkinCollection.prototype.removeById = function (id, callback) {
  return this._operateById('remove', id, arguments);
};

/**
 * Creates a cursor for a query that can be used to iterate over results from MongoDB.
 * 
 * @param {Object} query
 * @param {Object} options
 * @param {Function(err, docs)} callback
 * @return {SkinCursor|SkinCollection} if last argument is not a function, then returns a SkinCursor, 
 *   otherise return this
 * @api public
 */
SkinCollection.prototype.find = function (query, options, callback) {
  var args = __slice.call(arguments);
  if(this.isOpen()) {
    return this._native.find.apply(this._native, args);
  }
  if (args.length > 0 && typeof args[args.length - 1] === 'function') {
    this._find.apply(this, args);
    return this;
  } else {
    var cursor = new SkinCursor();
    cursor._skin_collection = this;
    cursor._find_args = args;
    return cursor;
  }
};
