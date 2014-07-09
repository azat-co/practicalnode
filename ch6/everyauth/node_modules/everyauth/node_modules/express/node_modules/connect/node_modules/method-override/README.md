# method-override [![Build Status](https://travis-ci.org/expressjs/method-override.svg)](https://travis-ci.org/expressjs/method-override) [![NPM version](https://badge.fury.io/js/method-override.svg)](http://badge.fury.io/js/method-override)

Lets you use HTTP verbs such as PUT or DELETE in places you normally can't.

Previously `connect.methodOverride()`.

## Install

```sh
$ npm install method-override
```

## API

**NOTE** It is very important that this module is used **before** any module that
needs to know the method of the request (for example, it _must_ be used prior to
the `csurf` module).

### methodOverride(key)

Create a new middleware function to override the `req.method` property with a new
value. This value will be pulled from the `X-HTTP-Method-Override` header of the
request. If this header is not present, then this module will look in the `req.body`
object for a property name given by the `key` argument (and if found, will delete
the property from `req.body`).

If the found method is supported by node.js core, then `req.method` will be set to
this value, as if it has originally been that value. The previous `req.method`
value will be stored in `req.originalMethod`.

#### key

This is the property to look for the overwritten method in the `req.body` object.
This defaults to `"_method"`.

## Examples

```js
var bodyParser = require('body-parser')
var connect = require('connect')
var methodOverride = require('method-override')

app.use(bodyParser())
app.use(methodOverride())
```

## License

The MIT License (MIT)

Copyright (c) 2014 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
