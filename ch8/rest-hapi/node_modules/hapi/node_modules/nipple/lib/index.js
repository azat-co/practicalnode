
// Load modules

var Url = require('url');
var Http = require('http');
var Https = require('https');
var Stream = require('stream');
var Zlib = require('zlib');
var Hoek = require('hoek');
var Boom = require('boom');


// Declare internals

var internals = {};


exports.request = function (method, url, options, callback, _trace) {

    options = options || {};

    Hoek.assert(options.payload === null || options.payload === undefined || typeof options.payload === 'string' || options.payload instanceof Stream || Buffer.isBuffer(options.payload), 'options.payload must be a string, a Buffer, or a Stream');

    // Setup request

    var uri = Url.parse(url);
    var timeoutId;
    uri.method = method.toUpperCase();
    uri.headers = options.headers;

    if (options.rejectUnauthorized !== undefined && uri.protocol === 'https:') {
        uri.rejectUnauthorized = options.rejectUnauthorized;
    }

    var redirects = (options.hasOwnProperty('redirects') ? options.redirects : false);      // Needed to allow 0 as valid value when passed recursively

    _trace = (_trace || []);
    _trace.push({ method: uri.method, url: url });

    var client = (uri.protocol === 'https:' ? Https : Http);
    if (options.agent) {
        uri.agent = options.agent;
    }

    var req = client.request(uri);

    var shadow = null;                                                                      // A copy of the streamed request payload when redirects are enabled

    // Register handlers

    var finish = function (err, res) {

        if (!callback || err) {
            if (res) {
                res.destroy();
            }

            req.abort();
        }

        req.removeListener('response', onResponse);
        req.removeListener('error', onError);
        req.on('error', Hoek.ignore);
        clearTimeout(timeoutId);

        if (callback) {
            return callback(err, res);
        }
    };

    finish = Hoek.once(finish);

    var onError = function (err) {

        err.trace = _trace;
        return finish(Boom.badGateway('Client request error', err));
    };

    req.once('error', onError);

    var onResponse = function (res) {

        // Pass-through response

        if (redirects === false ||
            [301, 302, 307, 308].indexOf(res.statusCode) === -1) {

            return finish(null, res);
        }

        // Redirection

        var redirectMethod = (res.statusCode === 301 || res.statusCode === 302 ? 'GET' : uri.method);
        var location = res.headers.location;

        res.destroy();

        if (redirects === 0) {
            return finish(Boom.badGateway('Maximum redirections reached', _trace));
        }

        if (!location) {
            return finish(Boom.badGateway('Received redirection without location', _trace));
        }

        if (!/^https?:/i.test(location)) {
            location = Url.resolve(uri.href, location);
        }

        var redirectOptions = {
            headers: options.headers,
            payload: shadow || options.payload,         // shadow must be ready at this point if set
            redirects: --redirects
        };

        return exports.request(redirectMethod, location, redirectOptions, finish, _trace);
    }

    req.once('response', onResponse);

    if (options.timeout) {
        timeoutId = setTimeout(function () {

            return finish(Boom.gatewayTimeout('Client request timeout'));
        }, options.timeout);
    }

    // Write payload

    if (uri.method !== 'GET' &&
        uri.method !== 'HEAD' &&
        options.payload !== null &&
        options.payload !== undefined) {            // Value can be falsey

        if (options.payload instanceof Stream) {
            var stream = options.payload;

            if (redirects) {
                var collector = new internals.Tap();
                collector.once('finish', function () {

                    shadow = collector.collect();
                });

                stream = options.payload.pipe(collector);
            }

            stream.pipe(req);
            return;
        }

        req.write(options.payload);
    }

    // Finalize request

    req.end();
};


// Tap

internals.Tap = function () {

    Stream.Transform.call(this);
    this.buffers = [];
};

Hoek.inherits(internals.Tap, Stream.Transform);


internals.Tap.prototype._transform = function (chunk, encoding, next) {

    this.buffers.push(chunk);
    next(null, chunk);
};


internals.Tap.prototype.collect = function () {

    return exports.toReadableStream(this.buffers);
};


// read()

exports.read = function (res /*, [options], callback */) {

    var options = (arguments.length === 3 ? arguments[1] : {});
    var callback = (arguments.length === 3 ? arguments[2] : arguments[1]);

    // Set stream timeout

    var clientTimeout = options.timeout;
    var clientTimeoutId = null;

    if (clientTimeout &&
        clientTimeout > 0) {

        clientTimeoutId = setTimeout(function () {

            finish(Boom.clientTimeout());
        }, clientTimeout);
    }

    // Finish once

    var finish = function (err, buffer) {

        clearTimeout(clientTimeoutId);
        reader.removeListener('error', onReaderError);
        reader.removeListener('finish', onReaderFinish);
        res.removeListener('error', onResError);
        res.removeListener('close', onResClose);
        res.on('error', Hoek.ignore);

        if (err ||
            !options.json) {

            return callback(err, buffer);
        }

        // Parse JSON

        var contentType = (res.headers && res.headers['content-type']) || '';
        var mime = contentType.split(';')[0].trim().toLowerCase();

        if (mime !== 'application/json') {
            return callback(null, buffer);
        }

        try {
            var json = JSON.parse(buffer.toString());
        }
        catch (err) {
            return callback(err, null);
        }

        return callback(null, json);
    };

    finish = Hoek.once(finish);

    // Hander errors

    var onResError = function (err) {

        return finish(Boom.internal('Payload stream error', err));
    };

    var onResClose = function () {

        return finish(Boom.internal('Payload stream closed prematurely'));
    };

    res.once('error', onResError);
    res.once('close', onResClose);

    // Read payload

    var reader = new internals.Recorder({ maxBytes: options.maxBytes });

    var onReaderError = function (err) {

        res.destroy();
        return finish(err);
    };

    reader.once('error', onReaderError);

    var onReaderFinish = function () {

        return finish(null, reader.collect());
    };

    reader.once('finish', onReaderFinish);

    res.pipe(reader);
};


// Recorder

internals.Recorder = function (options) {

    Stream.Writable.call(this);

    this.settings = options;                // No need to clone since called internally with new object
    this.buffers = [];
    this.length = 0;
};

Hoek.inherits(internals.Recorder, Stream.Writable);


internals.Recorder.prototype._write = function (chunk, encoding, next) {

    if (this.settings.maxBytes &&
        this.length + chunk.length > this.settings.maxBytes) {

        return this.emit('error', Boom.badRequest('Payload content length greater than maximum allowed: ' + this.settings.maxBytes));
    }

    this.length += chunk.length;
    this.buffers.push(chunk);
    next();
};


internals.Recorder.prototype.collect = function () {

    var buffer = (this.buffers.length === 0 ? new Buffer(0) : (this.buffers.length === 1 ? this.buffers[0] : Buffer.concat(this.buffers, this.length)));
    return buffer;
};


// toReadableStream()

exports.toReadableStream = function (payload, encoding) {

    return new internals.Payload(payload, encoding);
};


internals.Payload = function (payload, encoding) {

    Stream.Readable.call(this);
    this._data = [].concat(payload || '');
    this._encoding = encoding || 'utf8';
};

Hoek.inherits(internals.Payload, Stream.Readable);


internals.Payload.prototype._read = function (size) {

    for (var i = 0, il = this._data.length; i < il; ++i) {
        this.push(this._data[i], this._encoding);
    }

    this.push(null);
};


// parseCacheControl()

exports.parseCacheControl = function (field) {

    /*
        Cache-Control   = 1#cache-directive
        cache-directive = token [ "=" ( token / quoted-string ) ]
        token           = [^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+
        quoted-string   = "(?:[^"\\]|\\.)*"
    */

    //                             1: directive                                        =   2: token                                              3: quoted-string
    var regex = /(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g;

    var header = {};
    var err = field.replace(regex, function ($0, $1, $2, $3) {

        var value = $2 || $3;
        header[$1] = value ? value.toLowerCase() : true;
        return '';
    });

    if (header['max-age']) {
        try {
            var maxAge = parseInt(header['max-age'], 10);
            if (isNaN(maxAge)) {
                return null;
            }

            header['max-age'] = maxAge;
        }
        catch (err) { }
    }

    return (err ? null : header);
};


// Shortcuts

internals.shortcut = function (method, uri /*, options, callback */) {

    var options = (typeof arguments[2] === 'function' ? {} : arguments[2]);
    var callback = (typeof arguments[2] === 'function' ? arguments[2] : arguments[3]);

    exports.request(method, uri, options, function (err, res) {

        if (err) {
            return callback(err);
        }

        exports.read(res, options, function (err, payload) {

            if (payload instanceof Buffer) {
                payload = payload.toString();
            }

            return callback(err, res, payload);
        });
    });
};


exports.get = function (uri, options, callback) { internals.shortcut('GET', uri, options, callback); };
exports.post = function (uri, options, callback) { internals.shortcut('POST', uri, options, callback); };
exports.put = function (uri, options, callback) { internals.shortcut('PUT', uri, options, callback); };
exports.delete = function (uri, options, callback) { internals.shortcut('DELETE', uri, options, callback); };
