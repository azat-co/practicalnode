"use strict";

var GridStore = require('mongodb').GridStore;
var makeSkinClass = require('./utils').makeSkinClass;

var SkinGridStore = exports.SkinGridStore = makeSkinClass(GridStore);

SkinGridStore.prototype._open = function(callback) {
  var skin_db = this._construct_args[0];
  var args = this._construct_args.slice(1);
  skin_db.open(function(err, p_db) {
      if(err) return callback(err);
      args = ([null, p_db]).concat(args);
      var ctor = GridStore.bind.apply(GridStore, args);
      var gridStore = new ctor();
      gridStore.open(callback);
  });
}

function bindStaticMethod(methodName) {
  SkinGridStore[methodName] = function(skindb) {
    var args = Array.prototype.slice.call(arguments);
    skindb.open(function(err, p_db) {
        args[0] = p_db;
        GridStore[methodName].apply(GridStore, args);
    });
  }
}

bindStaticMethod('exist');
bindStaticMethod('list');
bindStaticMethod('read');
bindStaticMethod('readlines');
bindStaticMethod('unlink');
