// Load modules

var Hoek = require('hoek');
var Defaults = require('./defaults');
var Memory = require('./memory');
// Mongo, Redis, Riak, and Memcached are loaded below depending on the configuration


// Declare internals

var internals = {};


module.exports = internals.Client = function (options) {

    Hoek.assert(this.constructor === internals.Client, 'Cache client must be instantiated using new');
    this.settings = Defaults.apply(options);
    Hoek.assert(this.settings.partition && this.settings.partition.match(/^[\w\-]+$/), 'Invalid partition name:' + this.settings.partition);

    // Create internal connection

    var engine = this.settings.engine;
    if (engine === 'extension') {
        this.connection = this.settings.extension;
    }
    else {
        var factory = null;

        if (engine === 'redis') {
            factory = require('./redis');
        }
        else if (engine === 'mongodb') {
            factory = require('./mongo');
        }
        else if (engine === 'memcache') {
            factory = require('./memcache');
        }
        else if (engine === 'riak') {
            factory = require('./riak');
        }
        else if (engine === 'memory') {
            factory = Memory;
        } 

        Hoek.assert(factory, 'Unknown cache engine type');
        this.connection = new factory.Connection(this.settings);
    }

    return this;
};


internals.Client.prototype.stop = function () {

    this.connection.stop();
};


internals.Client.prototype.start = function (callback) {

    this.connection.start(callback);
};


internals.Client.prototype.isReady = function () {

    return this.connection.isReady();
};


internals.Client.prototype.validateSegmentName = function (name) {

    return this.connection.validateSegmentName(name);
};


internals.Client.prototype.get = function (key, callback) {

    var self = this;

    if (!this.connection.isReady()) {
        // Disconnected
        return callback(new Error('Disconnected'));
    }

    if (key === null) {
        // null key not allowed
        return callback(null, null);
    }

    if (!key || !key.id || !key.segment) {
        return callback(new Error('Invalid key'));
    }

    this.connection.get(key, function (err, result) {

        if (err) {
            // Connection error
            return callback(err);
        }

        if (!result ||
            !result.item) {

            // Not found
            return callback(null, null);
        }

        var now = Date.now();
        var expires = result.stored + result.ttl;
        var ttl = expires - now;
        if (ttl <= 0) {
            // Expired
            return callback(null, null);
        }

        // Valid

        var cached = {
            item: result.item,
            stored: result.stored,
            ttl: ttl
        };

        return callback(null, cached);
    });
};


internals.Client.prototype.set = function (key, value, ttl, callback) {

    if (!this.connection.isReady()) {
        // Disconnected
        return callback(new Error('Disconnected'));
    }

    if (!key || !key.id || !key.segment) {
        return callback(new Error('Invalid key'));
    }

    if (ttl > 2147483647) {                                                         // Math.pow(2, 31)
        return callback(new Error('Invalid ttl (greater than 2147483647)'));
    }

    if (ttl <= 0) {
        // Not cachable (or bad rules)
        return callback();
    }

    this.connection.set(key, value, ttl, callback);
};


internals.Client.prototype.drop = function (key, callback) {

    if (!this.connection.isReady()) {
        // Disconnected
        return callback(new Error('Disconnected'));
    }

    if (!key || !key.id || !key.segment) {
        return callback(new Error('Invalid key'));
    }

    this.connection.drop(key, callback);           // Always drop, regardless of caching rules
};


