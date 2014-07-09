# Replify

Easily add a REPL to your Node.js app.


## Status

[![Travis Build Status](https://secure.travis-ci.org/dshaw/replify.png)](http://travis-ci.org/dshaw/replify)

## Install

    npm install replify
	
## Usage

```js
var replify = require('replify')
  , app = require('http').createServer()

replify('realtime-101', app)
```

Advanced options.

```js
replify({ name: 'realtime-101', path: '/dshaw/repl' }, app, { 'other_context': io })
```

## replify(options, app, [contexts])

### `options`

`name` or `options` object.

- `name` [String] - Name for the REPL domain socket. Default: **replify**. You are going to want to assign a value for this. **Note:** Due to the fact that Node no longer cleans up domain socket files behind itself, `replify` automatically paves over the existing file when it starts.
- `path` [String] - Default: **/tmp/repl**. The REPL will be located at `{path}/{name}{extension}`.
- `extension` [String] - Default: **.sock**.
- `logger` [Object] - Default: **console**.
- `start` [Function] - Default: **require('repl').start**. Useful for custom repls like [replpad](https://github.com/thlorenz/replpad).
- `app` [Object] - Alternative to using the `app` parameter.
- `contexts` [Object] - Alternative to using the `contexts` parameter.

### `app`

Primary context. Exposed as:

    realtime-101> app

### `contexts`

Additional contexts exposed under the name of the key.

```js
replify('realtime-101', app, { 'io': io })
```

## Connect to the REPL

### NETCAT (nc)

    $ nc -U /tmp/repl/realtime-101.sock

### SOCAT

    $ socat READLINE /tmp/repl/realtime-101.sock

### repl-client (rc)

Node repl client with history scrollback and tab completion. Learn more about [`repl-client (rc)`](https://github.com/dshaw/repl-client). Install with `npm install repl-client -g`.

    $ rc /tmp/repl/realtime-101.sock
    
### Windows

Recommended to use `repl-client`. Note that Windows pipes don't live on disk, and the path to the socket is not *quite* the same as *nix environments.

    $ rc \\.\pipe\tmp-repl\realtime-101.sock

## License

(The MIT License)

Copyright (c) 2012-2014 Daniel D. Shaw, http://dshaw.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
