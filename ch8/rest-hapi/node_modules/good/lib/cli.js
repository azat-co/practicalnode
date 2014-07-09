// Load modules

var Fs = require('fs');
var Hoek = require('hoek');
var Http = require('http');
var Path = require('path');
var Os = require('os');
var Url = require('url');


// Declare internals

var internals = {
    lastIndex: 0,
    schemaName: 'good.v1',
    host: Os.hostname(),
    lastIndexPath: __dirname + '/lastBroadcast',
    appVer: Hoek.loadPackage(__dirname + '/..').version || 'unknown',                       // Look up a level to get the package.json page
    defaults: {
        useLastIndex: true,
        interval: 10000,
        onlySendNew: false
    }
};


internals.getLog = function (logPath, start, callback) {

    var log = '';
    var stream = Fs.createReadStream(logPath, { start: start });

    stream.on('readable', function () {

        var read = stream.read();
        if (read) {
            log += read.toString('ascii');
        }
    });

    stream.on('error', function (err) {

        console.error(err);
        stream.removeAllListeners();
        callback(0, []);
    });

    stream.once('end', function () {

        if (!log) {
            return callback(0, []);
        }

        var events = log.split('\n');
        var lastEvent = events[events.length - 1];
        var bytesRead = log.length;

        if (lastEvent[lastEvent.length - 1] !== '}') {                                      // Handle any incomplete events in the log
            events.pop();
            bytesRead -= Buffer.byteLength(lastEvent);
        }

        var result = [];
        for (var i = 0, il = events.length; i < il; ++i) {
            var event = events[i];
            if (event && event[0] === '{' && event[event.length - 1] === '}') {
                try {
                    result.push(JSON.parse(event));
                } catch (err) {
                    console.error(err);
                }
            }
        }

        callback(bytesRead, result);
    });
};


internals.broadcast = function (log) {

    if (!log.length) {
        return;
    }

    var envelope = {
        schema: internals.schemaName,
        host: internals.host,
        appVer: internals.appVer,
        timestamp: Date.now(),
        events: log
    };

    internals.request(JSON.stringify(envelope));
};


internals.request = function (payload) {

    var req = Http.request(internals.requestOptions, function (res) {

        res.on('error', function (err) {

            console.error(err);
        });

        res.pipe(process.stdout);                               // Pipe any response details to stdout
    });
    req.on('error', function (err) {

        console.error(err);
    });

    req.write(payload);
    req.end();
};


internals.getConfig = function (argv) {

    if (argv.c) {
        var configFile = Fs.readFileSync(argv.c);
        return JSON.parse(configFile.toString());
    }

    return {
        url: argv.u,
        path: argv.l[0] !== '/' ? process.cwd() + '/' + argv.l : argv.l,
        interval: argv.i ? parseInt(argv.i) : 10000,
        useLastIndex: argv.p !== undefined ? !!argv.p : true,
        onlySendNew: argv.n !== undefined ? !!argv.n : false,
    };
};


internals.logLastIndex = function (start) {

    var truncate = function (next) {

        Fs.exists(internals.lastIndexPath, function (exists) {

            if (!exists) {
                return next();
            }

            Fs.stat(internals.lastIndexPath, function (err, stat) {

                if (err) {
                    console.error(err);
                    return next();
                }

                Fs.truncate(internals.lastIndexPath, stat.size, next);
            });
        });
    };

    var log = function () {

        var lastIndexStream = Fs.createWriteStream(internals.lastIndexPath);

        lastIndexStream.on('error', function (err) {

            console.error(err);
            lastIndexStream.removeAllListeners();
        });

        lastIndexStream.write('\n' + start.toString(), function (err) {

            if (err) {
                console.error(err);
                return;
            }
        });
    };

    truncate(log);
};


exports.start = function (argv) {

    process.once('SIGUSR2', function () {

        process.exit(0);
    });

    var start = 0;
    var config = internals.getConfig(argv);
    config = Hoek.applyToDefaults(internals.defaults, config);

    internals.requestOptions = Url.parse(config.url);
    internals.requestOptions.method = 'POST';
    internals.requestOptions.headers = { 'content-type': 'application/json' };
    internals.requestOptions.agent = false;

    var determineStart = function (next) {

        if (config.useLastIndex) {
            internals.lastIndexPath += ('_' + Path.basename(config.path));
        }

        if (config.useLastIndex && Fs.existsSync(internals.lastIndexPath)) {
            var lastContents = Fs.readFileSync(internals.lastIndexPath).toString().split('\n');
            start = parseInt(lastContents[lastContents.length - 1]);
            start = isNaN(start) ? 0 : start;
            Fs.truncateSync(internals.lastIndexPath);
            return next();
        }

        if (!config.onlySendNew) {
            return next();
        }

        Fs.exists(config.path, function (exists) {

            if (!exists) {
                return next();
            }

            Fs.stat(config.path, function (err, stat) {

                if (!err) {
                    start = stat.size ? stat.size - 1 : 0;
                }

                next();
            });
        });
    };

    var processLog = function () {

        Fs.exists(config.path, function (exists) {

            if (!exists) {
                return;
            }

            Fs.stat(config.path, function (err, stat) {

                if (err) {
                    console.error(err);
                    return;
                }

                if (stat.size < start) {
                    start = 0;
                }

                internals.getLog(config.path, start, function (bytesRead, log) {

                    start += bytesRead;
                    internals.broadcast(log);
                    if (config.useLastIndex) {
                        internals.logLastIndex(start);
                    }
                });
            });
        });
    };

    determineStart(function () {

        setInterval(processLog, config.interval);
    });
};

