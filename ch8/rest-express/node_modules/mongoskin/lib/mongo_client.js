var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var utils = require('./utils');

var SkinDb = require('./db').SkinDb;

var SkinMongoClient = utils.makeSkinClass(MongoClient, true);
exports.SkinMongoClient = SkinMongoClient;

SkinMongoClient.connect = function() {
  var args = [].slice.call(arguments);
  var db = new SkinDb();
  db._connect_args = args;
  return db;
}
