/*!
 * replify
 * Copyright(c) 2012-2013 Daniel D. Shaw, http://dshaw.com
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var fs = require('fs')
  , net = require('net')
  , path = require('path')
  , repl = require('repl')

/**
 * Exports - replify
 */
function cleanPipeName(str) {
  if (process.platform === 'win32') {
    str = str.replace(/^\//, '');
    str = str.replace(/\//g, '-');
    return '\\\\.\\pipe\\'+str;
  } else {
    return str;
  }
}

module.exports = function replify (options, app, contexts) {
  options = (options && options.name) ? options : { name: options }

  options.app                         || (options.app = app)
  options.columns                     || (options.columns = 132)
  options.contexts                    || (options.contexts = (typeof contexts === 'object') ? contexts : {})
  options.extension                   || (options.extension = '.sock')
  options.logger                      || (options.logger = console)
  options.name                        || (options.name = 'replify')
  options.path                        || (options.path = '/tmp/repl')
  options.start                       || (options.start = repl.start)
  options.hasOwnProperty('useColors') || (options.useColors = true)

  options.replPath = cleanPipeName(options.path + path.sep + options.name + options.extension)

  var logger = options.logger
    , replServer = net.createServer()

  replServer.on('connection', function onRequest(socket) {
    var rep = null
        , replOptions = {
          prompt: options.name + '> '
          , input: socket
          , output: socket
          , terminal: true
          , useGlobal: false
          , useColors: options.useColors
        }

    // Set screen width. Especially useful for autocomplete.
    // Since we expose the socket context, we can view
    // You can modify this locally in your repl with `socket.columns`.
    socket.columns = options.columns

    // start the repl instance
    if (typeof fs.exists === 'undefined') { // We're in node v0.6. Start legacy repl.

      logger.warn('starting legacy repl')
      rep = repl.start(replOptions.prompt, socket)

    } else {

      rep = options.start(replOptions)
      rep.on('exit', socket.end.bind(socket))
      rep.on('error', function (err) {
        logger.error('repl error', err)
      })

    }

    // expose the socket itself to the repl
    rep.context.replify = options

    // expose the socket itself to the repl
    rep.context.socket = socket

    if (options.app) {
      rep.context.app = options.app
    }

    Object.keys(options.contexts).forEach(function (key) {
      if (rep.context[key]) {
        // don't pave over existing contexts
        logger.warn('unable to register context: ' + key)
      } else {
        rep.context[key] = options.contexts[key]
      }
    })
  })

  replServer.on('error', function (err) {
    logger.error('repl server error', err)
  })

  var start = replServer.listen.bind(replServer, options.replPath)

  // with windows, pipes are different, so we don't actually need to create
  // anything and we go ahead and listen right away
  if (process.platform === 'win32') {
    start()
  } else {
    fs.mkdir(options.path, function (err) {
      if (err && err.code !== 'EEXIST') {
        return logger.error('error making repl directory: ' + options.path, err)
      }

      fs.unlink(options.replPath, function () {
        // NOTE: Intentionally not listening for any errors.
        replServer.listen(options.replPath)
      })
    })
  }

  return replServer
}
