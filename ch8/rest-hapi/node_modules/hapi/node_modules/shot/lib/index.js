// Load modules

var Util = require('util');
var Http = require('http');
var Stream = require('stream');
var Url = require('url');


// Declare internals

var internals = {};


internals.Request = function (options) {

    var self = this;

    Stream.Readable.call(this);

    // options: method, url, payload, headers

    var uri = Url.parse(options.url);
    this.url = uri.path;

    this.httpVersion = '1.1';
    this.method = options.method.toUpperCase();

    this.headers = {};
    var headers = options.headers || {};
    var fields = Object.keys(headers);
    fields.forEach(function (field) {

        self.headers[field.toLowerCase()] = headers[field];
    });

    this.headers['user-agent'] = this.headers['user-agent'] || 'shot'

    if (uri.host &&
        !this.headers.host) {

        this.headers.host = uri.host;
    }

    // Use _shot namespace to avoid collision with Node

    var payload = options.payload || null;
    if (payload &&
        typeof payload !== 'string' &&
        payload instanceof Buffer === false) {

        payload = JSON.stringify(payload);
        this.headers['content-type'] = this.headers['content-type'] || 'application/json';
    }

    this._shot = {
        payload: payload,
        isDone: false,
        simulate: options.simulate || {}
    };

    return this;
};

Util.inherits(internals.Request, Stream.Readable);


internals.Request.prototype._read = function (size) {

    var self = this;

    setImmediate(function () {

        if (self._shot.isDone) {
            if (self._shot.simulate.end !== false) {        // 'end' defaults to true
                self.push(null);
            }

            return;
        }

        self._shot.isDone = true;

        if (self._shot.payload) {
            if (self._shot.simulate.split) {
                self.push(self._shot.payload.slice(0, 1));
                self.push(self._shot.payload.slice(1));
            }
            else {
                self.push(self._shot.payload);
            }
        }

        if (self._shot.simulate.error) {
            self.emit('error', new Error('Simulated'));
        }

        if (self._shot.simulate.close) {
            self.emit('close');
        }

        if (self._shot.simulate.end !== false) {        // 'end' defaults to true
            self.push(null);
        }
    });
};


internals.Request.prototype.destroy = function () {

};


internals.Response = function (req, onEnd) {

    Http.ServerResponse.call(this, { method: req.method, httpVersionMajor: 1, httpVersionMinor: 1 });

    this.once('finish', internals.finish(this, req, onEnd));

    return this;
};

Util.inherits(internals.Response, Http.ServerResponse);


internals.Response.prototype.writeHead = function () {

    var self = this;

    var headers = ((arguments.length === 2 && typeof arguments[1] === 'object') ? arguments[1] : (arguments.length === 3 ? arguments[2] : {}));
    var result = Http.ServerResponse.prototype.writeHead.apply(this, arguments);

    this._headers = this._headers || {};
    var keys = Object.keys(headers);
    for (var i = 0, il = keys.length; i < il; ++i) {
        this._headers[keys[i]] = headers[keys[i]];
    }

    // Add raw headers

    ['Date', 'Connection', 'Transfer-Encoding'].forEach(function (name) {

        var regex = new RegExp('\\r\\n' + name + ': ([^\\r]*)\\r\\n');
        var field = self._header.match(regex);
        if (field) {
            self._headers[name.toLowerCase()] = field[1];
        }
    });

    return result;
};


internals.Response.prototype.write = function (data, encoding) {

    Http.ServerResponse.prototype.write.call(this, data, encoding);
    return true;                                                    // Write always returns false when disconnected
};


internals.Response.prototype.end = function (data, encoding) {

    Http.ServerResponse.prototype.end.call(this, data, encoding);
    this.emit('finish');                                            // Will not be emitted when disconnected
};


internals.Response.prototype.destroy = function () {

};


internals.finish = function (response, req, onEnd) {

    return function () {

        // Prepare response object

        var res = {
            raw: {
                req: req,
                res: response
            },
            headers: response._headers,
            statusCode: response.statusCode
        };

        // When done, call callback

        process.nextTick(function () {

            onEnd(res);
        });

        // Read payload

        var raw = [];
        var rawLength = 0;
        for (var i = 0, il = response.output.length; i < il; ++i) {
            var chunk = (response.output[i] instanceof Buffer ? response.output[i] : new Buffer(response.output[i], response.outputEncodings[i]));
            raw.push(chunk);
            rawLength += chunk.length;
        }

        var rawBuffer = Buffer.concat(raw, rawLength);

        // Parse payload

        var CRLF = '\r\n';

        var output = rawBuffer.toString('binary');
        var sep = output.indexOf(CRLF + CRLF);
        var payloadBlock = output.slice(sep + 4);
        var headerBlock = output.slice(0, sep);

        res.rawPayload = new Buffer(rawBuffer.length - sep - 4);
        rawBuffer.copy(res.rawPayload, 0, sep + 4);

        if (!res.headers['transfer-encoding']) {
            res.payload = payloadBlock;
            return;
        }

        var rest = payloadBlock;
        res.payload = '';

        do {
            var next = rest.indexOf(CRLF);
            var size = parseInt(rest.slice(0, next), 16);
            if (size === 0) {
                rest = rest.slice(3);
            }
            else {
                res.payload += rest.substr(next + 2, size);
                rest = rest.slice(next + 2 + size + 2);
            }
        }
        while (size);

        var headers = rest.split(CRLF);
        headers.forEach(function (header) {

            var parts = header.split(':');
            if (parts.length === 2) {
                response._headers[parts[0].trim().toLowerCase()] = parts[1].trim();
            }
        });
    };
};


internals.Response.prototype.destroy = function () {

};


exports.inject = function (dispatchFunc, options, callback) {

    options = (typeof options === 'string' ? { method: 'GET', url: options } : options);
    options.method = options.method || 'GET';

    var req = new internals.Request(options);
    var res = new internals.Response(req, callback);
    dispatchFunc(req, res);
};


exports.isInjection = function (obj) {

    return (obj instanceof internals.Request || obj instanceof internals.Response);
};


