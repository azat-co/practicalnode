/*!
 * Expressjs | Connect - compress
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var zlib = require('zlib');
var bytes = require('bytes');
var Negotiator = require('negotiator');
var compressible = require('compressible');

/**
 * Supported content-encoding methods.
 */

exports.methods = {
    gzip: zlib.createGzip
  , deflate: zlib.createDeflate
};

/**
 * Default filter function.
 */

exports.filter = function(req, res){
  return compressible(res.getHeader('Content-Type'));
};

/**
 * Compress response data with gzip / deflate.
 *
 * See README.md for documentation of options.
 *
 * @param {Object} options
 * @return {Function} middleware
 * @api public
 */

module.exports = function compress(options) {
  options = options || {};
  var filter = options.filter || exports.filter;
  var threshold;

  if (false === options.threshold || 0 === options.threshold) {
    threshold = 0
  } else if ('string' === typeof options.threshold) {
    threshold = bytes(options.threshold)
  } else {
    threshold = options.threshold || 1024
  }

  return function compress(req, res, next){
    var accept = req.headers['accept-encoding']
      , writeHead = res.writeHead
      , write = res.write
      , end = res.end
      , compress = true
      , stream;

    // see #8
    req.on('close', function(){
      res.write = res.end = function(){};
    });

    // flush is noop by default
    res.flush = noop;

    // proxy

    res.write = function(chunk, encoding){
      if (!this._header) {
        // if content-length is set and is lower
        // than the threshold, don't compress
        var length = res.getHeader('content-length');
        if (!isNaN(length) && length < threshold) compress = false;
        this._implicitHeader();
      }
      return stream
        ? stream.write(new Buffer(chunk, encoding))
        : write.call(res, chunk, encoding);
    };

    res.end = function(chunk, encoding){
      if (chunk) {
        if (!this._header && getSize(chunk) < threshold) compress = false;
        this.write(chunk, encoding);
      } else if (!this._header) {
        // response size === 0
        compress = false;
      }
      return stream
        ? stream.end()
        : end.call(res);
    };

    res.writeHead = function(){
      // set headers from args
      var args = setWriteHeadHeaders.apply(this, arguments);

      // default request filter
      if (!filter(req, res)) return writeHead.apply(res, args);

      // vary
      var vary = res.getHeader('Vary');
      if (!vary) {
        res.setHeader('Vary', 'Accept-Encoding');
      } else if (!~vary.indexOf('Accept-Encoding')) {
        res.setHeader('Vary', vary + ', Accept-Encoding');
      }

      if (!compress) return writeHead.apply(res, args);

      var encoding = res.getHeader('Content-Encoding') || 'identity';

      // already encoded
      if ('identity' != encoding) return writeHead.apply(res, args);

      // SHOULD use identity
      if (!accept) return writeHead.apply(res, args);

      // head
      if ('HEAD' == req.method) return writeHead.apply(res, args);

      // compression method
      var method = new Negotiator(req).preferredEncoding(['gzip', 'deflate', 'identity']);
      // negotiation failed
      if (!method || method === 'identity') return writeHead.apply(res, args);

      // compression stream
      stream = exports.methods[method](options);

      // overwrite the flush method
      res.flush = function(){
        stream.flush();
      }

      // header fields
      res.setHeader('Content-Encoding', method);
      res.removeHeader('Content-Length');

      // compression
      stream.on('data', function(chunk){
        write.call(res, chunk);
      });

      stream.on('end', function(){
        end.call(res);
      });

      stream.on('drain', function() {
        res.emit('drain');
      });

      writeHead.apply(res, args);
    };

    next();
  };
};

function getSize(chunk) {
  return Buffer.isBuffer(chunk)
    ? chunk.length
    : Buffer.byteLength(chunk);
}

function noop(){}

function setWriteHeadHeaders() {
  var headerIndex = typeof arguments[1] === 'string'
    ? 2
    : 1;

  var headers = arguments[headerIndex];

  // the following block is from node.js core
  if (Array.isArray(headers)) {
    // handle array case
    for (var i = 0, len = headers.length; i < len; ++i) {
      this.setHeader(headers[i][0], headers[i][1]);
    }
  } else if (headers) {
    // handle object case
    var keys = Object.keys(headers);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k) this.setHeader(k, headers[k]);
    }
  }

  return Array.prototype.slice.call(arguments, 0, headerIndex);
}
