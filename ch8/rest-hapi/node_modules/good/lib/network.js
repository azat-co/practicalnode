// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


module.exports.Monitor = internals.NetworkMonitor = function (events) {

    this._requests = {};
    this._connections = {};
    this._responseTimes = {};

    events.on('request', this._onRequest.bind(this));
    events.on('response', this._onResponse.bind(this));
};


internals.NetworkMonitor.prototype.requests = function (callback) {

    return callback(null, this._requests);
};


internals.NetworkMonitor.prototype.concurrents = function (callback) {

    var ports = Object.keys(this._connections);
    var concurrents = {};
    for (var i = 0, il = ports.length; i < il; ++i) {
        var port = ports[i];
        concurrents[port] = this._connections[port] ? Object.keys(this._connections[port]).length : 0;
    }

    return callback(null, concurrents);
};


internals.NetworkMonitor.prototype.responseTimes = function (callback) {

    var ports = Object.keys(this._responseTimes);
    var overview = {};
    for (var i = 0, il = ports.length; i < il; ++i) {
        var port = ports[i];
        var count = this._responseTimes[port].count ? this._responseTimes[port].count : 1;
        overview[port] = {
            avg: this._responseTimes[port].total / count,
            max: this._responseTimes[port].max
        }
    }

    return callback(null, overview);
};


internals.NetworkMonitor.prototype.reset = function () {

    var ports = Object.keys(this._requests);
    for (var i = 0, il = ports.length; i < il; ++i) {
        this._requests[ports[i]] = { total: 0, disconnects: 0, statusCodes: {} };
        this._responseTimes[ports[i]] = { count: 0, total: 0, max: 0 };
    }
};


internals.NetworkMonitor.prototype._onRequest = function (request, event, tags) {

    var port = (request.server && request.server.info.port) || 0;
    this._connections[port] = this._connections[port] || request.server._connections;

    if (event.tags &&
        event.tags.indexOf('received') !== -1 &&                            // Workaround current plugin event bug
        event.tags.indexOf('hapi') !== -1) {

        this._requests[port] = this._requests[port] || { total: 0, disconnects: 0, statusCodes: {} };
        this._requests[port].total++;
    }
};


internals.NetworkMonitor.prototype._onResponse = function (request) {

    var msec = Date.now() - request.info.received;
    var port = (request.server && request.server.info.port) || 0;

    var response = request.response;
    var statusCode = response.statusCode;

    this._responseTimes[port] = this._responseTimes[port] || { count: 0, total: 0, max: 0 };
    this._responseTimes[port].count++;
    this._responseTimes[port].total += msec;

    if (this._responseTimes[port].max < msec) {
        this._responseTimes[port].max = msec;
    }

    this._requests[port].statusCodes[statusCode] = this._requests[port].statusCodes[statusCode] || 0;
    this._requests[port].statusCodes[statusCode]++;

    var log = request.getLog('aborted');
    if (log.length) {
        this._requests[port].disconnects++;
    }
};
