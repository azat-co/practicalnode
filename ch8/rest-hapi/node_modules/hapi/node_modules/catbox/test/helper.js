// Load modules

var Net = require('net');


// Declare internals

var internals = {};


exports.testRedis = function (callback) {

    var redis = Net.createConnection(6379);
    redis.once('error', function () {

        callback(false);
    });
    redis.once('connect', function () {

        redis.end();
        callback(true);
    });
};

exports.testRiak = function (callback) {

    var riak = Net.createConnection(8087);
    riak.once('error', function () {

        callback(false);
    });
    riak.once('connect', function () {

        riak.end();
        callback(true);
    });
};

exports.testMemcache = function (callback) {

    var memcache = Net.createConnection(11211);
    memcache.once('error', function () {

        callback(false);
    });
    memcache.once('connect', function () {

        memcache.end();
        callback(true);
    });
};


exports.testMongo = function (callback) {

    var mongo = Net.createConnection(27017);
    mongo.once('error', function () {

        callback(false);
    });
    mongo.once('connect', function () {

        mongo.end();
        callback(true);
    });
};

