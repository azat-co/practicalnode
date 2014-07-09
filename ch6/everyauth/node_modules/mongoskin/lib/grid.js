"use strict";

var Grid = require('mongodb').Grid;
var makeSkinClass = require('./utils').makeSkinClass;

var SkinGrid = exports.SkinGrid = makeSkinClass(Grid);

SkinGrid.prototype._open = function(callback) {
  var skin_db = this._construct_args[0];
  var fsName = this._construct_args[1];
  skin_db.open(function(err, p_db) {
      if(err) return callback(err);
      var grid = new Grid(p_db, fsName);
      callback(null, grid);
  });
}
