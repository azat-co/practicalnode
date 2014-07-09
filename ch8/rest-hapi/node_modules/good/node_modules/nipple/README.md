<a href="https://github.com/spumko"><img src="https://raw.github.com/spumko/spumko/master/images/from.png" align="right" /></a>
![nipple Logo](https://raw.github.com/spumko/nipple/master/images/nipple.png)

HTTP Client Utilities

[![Build Status](https://secure.travis-ci.org/spumko/nipple.png)](http://travis-ci.org/spumko/nipple)

## Usage
### Basic
```javascript
var Nipple = require('nipple');

Nipple.get('https://google.com/', function (err, res, payload) {
    /* do stuff */
});
```

### Advanced
```javascript
var Nipple = require('nipple');
var Http   = require('http');

var method = 'GET'; // GET, POST, PUT, DELETE
var uri    = 'https://google.com/';
var readableStream = Nipple.toReadableStream('foo=bar');

// all attributes are optional
var options = {
    payload:   readableStream || 'foo=bar' || new Buffer('foo=bar'),
    headers:   { /* http headers */ },
    redirects: 3,
    timeout:   1000,    // 1 second, default: unlimited
    maxBytes:  1048576, // 1 MB, default: unlimited
    rejectUnauthorized: true || false,
    downstreamRes: null,
    agent: null // Http.Agent
};

var optionalCallback = function (err, res) {

    // buffer the response stream
    Nipple.read(res, function (err, body) {
        /* do stuff */
    });
};

Nipple.request(method, uri, options, optionalCallback);
```

### Stream Dependencies
```javascript
var Nipple = require('nipple');

Nipple.get('http://google.com', { downstreamRes: dependentStream }, function (err, res) {

    expect(err).to.not.exist;
    res.pipe(dependentStream);
});
```
