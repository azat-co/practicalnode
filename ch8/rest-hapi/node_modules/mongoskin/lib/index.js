/*!
 * mongoskin - index.js
 *
 * Copyright(c) 2011 - 2012 kissjs.org
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var mongo = require('mongodb');

/*
 * exports mongo classes ObjectID Long Code DbRef ... to mongoskin
 */
for (var key in mongo) {
  exports[key] = mongo[key];
}

// exports.Foo = SkinFoo;
;['mongo_client', 'db', 'collection', 'cursor', 'admin', 'grid', 'grid_store'].forEach(function(modPath){
    var mod = require('./' + modPath);
    for(var name in mod) {
      if(name.indexOf('Skin') == 0) {
        exports[name.substring(4)] = mod[name];
      }
    }
});

exports.helper = require('./helper');
exports.utils = require('./utils');

exports.db = exports.MongoClient.connect;
