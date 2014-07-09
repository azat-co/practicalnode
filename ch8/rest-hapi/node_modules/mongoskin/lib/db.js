/*!
 * mongoskin - db.js
 *
 * Copyright(c) 2011 - 2012 kissjs.org
 * Copyright(c) 2012 fengmk2 <fengmk2@gmail.com>
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 * TODO db.gridfs()
 */

var mongodb = require('mongodb');
var Db = mongodb.Db;
var MongoClient = mongodb.MongoClient;
var utils = require('./utils');
var SkinAdmin = require('./admin').SkinAdmin;
var SkinCollection = require('./collection').SkinCollection;
var SkinGrid = require('./grid').SkinGrid;
var SkinGridStore = require('./grid_store').SkinGridStore;

/**
 * Constructor
 */
var SkinDb = exports.SkinDb = utils.makeSkinClass(Db, true);

SkinDb.prototype._open = function(callback) {
  // TODO authenticate support
  if(this._native) {
    this._native.open(callback);
  } else if(this._connect_args) {
    var args = this._connect_args.concat(callback);
    MongoClient.connect.apply(MongoClient, args);
  }
}

/**
 * Create or retrieval skin collection
 *
 * @param {String} name, the collection name.
 * @param {Object} [options] collection options.
 * @param {Function} [callback]
 * @return {SkinCollection}
 * @api public
 */
SkinDb.prototype.collection = function (name, options, callback) {
  if(!callback && typeof options == 'function') {
    callback = options;
    options = undefined;
  }
  // Ooops, no extended mthods like findById etc.
  // if(this.isOpen() && (!options || !options.strict) && !callback) {
  //   // mongodb now support collection without callback
  //   // see: http://mongodb.github.io/node-mongodb-native/api-generated/db.html#collection
  //   return this._native.collection(name, options);
  // }
  var collection = new SkinCollection();
  collection._skin_db = this;
  collection._collection_args = [name, options];
  if (callback) {
    collection.open(callback);
  }
  return collection;
};

/**
 * @param {String} name the collection name
 * @param {Object} [options] collection options
 * @return {SkinCollection} collection
 */
SkinDb.prototype.bind = function (name, options) {
  return this[name] = this.collection(name, options);
}

SkinDb.prototype.admin = function () {
  var skinAdmin = new SkinAdmin();
  skinAdmin._construct_args = [this];
  return skinAdmin;
}

SkinDb.prototype.grid = function (fsName) {
  var skinGrid = new SkinGrid();
  skinGrid._construct_args = [this, fsName];
  return skinGrid;
}

SkinDb.prototype.gridStore = function () {
  var skinGridStore = new SkinGridStore();
  var args = Array.prototype.slice.call(arguments);
  args.unshift(this);
  skinGridStore._construct_args = args;
  return skinGridStore;
}
