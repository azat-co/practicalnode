// Load modules

var Hoek = require('hoek');
var Riak = require('riakpbc');

// Declare internals

var internals = {};

exports.Connection = internals.Connection = function (options) {

    Hoek.assert(this.constructor === internals.Connection, 'Riak cache client must be instantiated using new')

    Hoek.assert(typeof options.partition === 'string', 'Must specify a partition to use.');
    
    this.settings = options;
    this.client = null;
    return this;
};

internals.Connection.prototype.start = function (callback) {

    if (this.client) {
        return callback();
    }

    this.client = Riak.createClient({
        host: this.settings.host,
        port:  this.settings.port
    });
    return callback();
};

internals.Connection.prototype.stop = function () {

    if (this.client) {
        this.client.disconnect();
        this.client = null;
    }
};

internals.Connection.prototype.isReady = function () {

    return this.client == null ? false : true;
};

internals.Connection.prototype.validateSegmentName = function (name) {

    if (!name) {
        return new Error('Empty string');
    }

    if (name.indexOf('\0') !== -1) {
        return new Error('Includes null character');
    }

    return null;
};

internals.Connection.prototype.get = function (key, callback) {

    if (!this.client) {
        return callback(new Error('Connection not started'));
    }

    this.client.get({
        bucket: this.settings.partition,
        key: this.generateKey(key)
    }, function (err, reply) {
        
        if (err) return callback(err);
        if (!reply.content || !Array.isArray(reply.content)) return callback(null, null);

        var envelope = null;
        try { 
            envelope = JSON.parse(reply.content[0].value);
        }
        catch (err) { }

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
    
    this.client.put({
        bucket: this.settings.partition,
        key: cacheKey,
        content: { 
            value: stringifiedEnvelope, 
            content_type: 'text/plain',
            indexes: [
                { key: 'ttl_int', value: Date.now() + ttl }
            ]
        }
    }, function (err, reply) {

        return callback(err);
    });

    this.riakgc(ttl);
};

internals.Connection.prototype.drop = function (key, callback) {

    if (!this.client) {
        return callback(new Error('Connection not started'));
    }

    this.client.del({
        key: this.generateKey(key),
        bucket: this.settings.partition
    }, function (err) {

        return callback(err);
    });
};

internals.Connection.prototype.riakgc = function (ttl) {

    var make_cleaner = function (timeout) {

        return setTimeout(function () {

            var stream = this.client.getIndex({
                bucket: this.settings.partition,
                index: 'ttl_int',
                qtype: 1,
                range_min: 1,
                range_max: this._gcttl
            });
            stream.on('data', function (reply) {

                return reply.keys.map(function (key) {

                    this.client.del({
                        bucket: this.settings.partition,
                        key: key
                    }, function (err, reply) { });
                }.bind(this));
            }.bind(this));
            stream.on('error', function () { });
        }.bind(this), timeout);
    }.bind(this);

    if (!this._gcttl) {
        this._gcttl = Date.now() + ttl;
        this._gcfunc = make_cleaner(this._gcttl);
    }

    var newttl = Date.now() + ttl;
    if (newttl < this._gcttl) {
        this._gcttl = newttl;
        clearTimeout(this._gcfunc);
        this._gcfunc = make_cleaner(this._gcttl);
    }

    return;
};

internals.Connection.prototype.generateKey = function (key) {

    return encodeURIComponent(key.segment) + ':' + encodeURIComponent(key.id);
};
