// Load modules

var Memcache = require('memcached');
var Hoek = require('hoek');


// Declare internals

var internals = {};


exports.Connection = internals.Connection = function (options) {

    Hoek.assert(this.constructor === internals.Connection, 'Memcache cache client must be instantiated using new');

    this.settings = options;
    this.client = null;
    return this;
};


internals.Connection.prototype.start = function (callback) {

    var self = this;
    if (this.client) {
        return callback();
    }

    this.client = new Memcache(this.settings.location, this.settings);

    this.client.get('foobar', function (err) {

        if (err) {
            self.client.end();
            self.client = null;
            return callback(err);
        }

        callback();
    });
};


internals.Connection.prototype.stop = function () {

    if (this.client) {
        this.client.end();
        this.client = null;
    }
};


internals.Connection.prototype.isReady = function () {

    return (!!this.client);
};


internals.Connection.prototype.validateSegmentName = function (name) {

    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\0') !== -1) {
        return new Error('Includes null character');
    }

    // https://github.com/memcached/memcached/blob/master/doc/protocol.txt#L47-49

    if (name.match(/\s/g)) {
        return new Error('Includes space character');
    }

    return null;
};


internals.Connection.prototype.get = function (key, callback) {

    if (!this.client) {
        return callback(new Error('Connection not started'));
    }

    this.client.get(this.generateKey(key), function (err, result) {

        if (err) {
            return callback(err);
        }

        if (!result) {
            return callback(null, null);
        }

        var envelope = null;
        try {
            envelope = JSON.parse(result);
        }
        catch (err) { }  // Handled by validation below

        if (!envelope) {
            return callback(new Error('Bad envelope content'));
        }

        if (!envelope.item ||
            !envelope.stored) {

            return callback(new Error('Incorrect envelope structure'));
        }

        return callback(null, envelope);
    });
};


internals.Connection.prototype.set = function (key, value, ttl, callback) {

    var self = this;

    if (!this.client) {
        return callback(new Error('Connection not started'));
    }

    var envelope = {
        item: value,
        stored: Date.now(),
        ttl: ttl
    };

    var cacheKey = this.generateKey(key);

    var stringifiedEnvelope = null;

    try {
        stringifiedEnvelope = JSON.stringify(envelope);
    }
    catch (err) {
        return callback(err);
    }

    var ttlSec = Math.max(1, Math.floor(ttl / 1000));
    this.client.set(cacheKey, stringifiedEnvelope, ttlSec, callback);
};


internals.Connection.prototype.drop = function (key, callback) {

    if (!this.client) {
        return callback(new Error('Connection not started'));
    }

    this.client.del(this.generateKey(key), function (err) {

        return callback(err);
    });
};


internals.Connection.prototype.generateKey = function (key) {

    return encodeURIComponent(this.settings.partition) + ':' + encodeURIComponent(key.segment) + ':' + encodeURIComponent(key.id);
};
