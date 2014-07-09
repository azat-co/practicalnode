// Load modules

var Http = require('http');
var Events = require('events');
var Path = require('path');
var Fs = require('fs');
var Events = require('events');
var Stream = require('stream');
var Lab = require('lab');
var Boom = require('boom');
var Nipple = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Nipple', function () {

    var payload = '0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789';

    describe('#request', function () {

        it('requests a resource with callback', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(payload);
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {}, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('requests a POST resource', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                req.pipe(res);
            });

            server.listen(0, function () {

                Nipple.request('post', 'http://localhost:' + server.address().port, { payload: payload }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('requests a POST resource with stream payload', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                req.pipe(res);
            });

            server.listen(0, function () {

                Nipple.request('post', 'http://localhost:' + server.address().port, { payload: Nipple.toReadableStream(payload) }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('requests a resource without callback', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(payload);
                server.close();
                done();
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {});
            });
        });

        it('requests an https resource', function (done) {

            Nipple.request('get', 'https://google.com', { rejectUnauthorized: true }, function (err, res) {

                expect(err).to.not.exist;
                Nipple.read(res, function (err, body) {

                    expect(err).to.not.exist;
                    expect(body.toString()).to.contain('<HTML>');
                    done();
                });
            });
        });

        it('requests a resource with downstream dependency', function (done) {

            var up = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end(payload);
            });

            up.listen(0, function () {

                var down = Http.createServer(function (req, res1) {

                    res1.writeHead(200, { 'Content-Type': 'text/plain' });
                    Nipple.request('get', 'http://localhost:' + up.address().port, { downstreamRes: res1 }, function (err, res2) {

                        expect(err).to.not.exist;
                        res2.pipe(res1);
                    });
                });

                down.listen(0, function () {

                    Nipple.request('get', 'http://localhost:' + down.address().port, {}, function (err, res) {

                        expect(err).to.not.exist;
                        Nipple.read(res, function (err, body) {

                            expect(err).to.not.exist;
                            expect(body.toString()).to.equal(payload);
                            up.close();
                            down.close();
                            done();
                        });
                    });
                });
            });
        });

        it('does not follow redirections by default', function (done) {

            var gen = 0;
            var server = Http.createServer(function (req, res) {

                if (!gen++) {
                    res.writeHead(301, { 'Location': 'http://localhost:' + server.address().port });
                    res.end();
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(payload);
                }
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {}, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(res.statusCode).to.equal(301);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('handles redirections', function (done) {

            var gen = 0;
            var server = Http.createServer(function (req, res) {

                if (!gen++) {
                    res.writeHead(301, { 'Location': 'http://localhost:' + server.address().port });
                    res.end();
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(payload);
                }
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, { redirects: 1 }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('handles redirections with relative location', function (done) {

            var gen = 0;
            var server = Http.createServer(function (req, res) {

                if (!gen++) {
                    res.writeHead(301, { 'Location': '/' });
                    res.end();
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(payload);
                }
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, { redirects: 1 }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('reaches max redirections count', function (done) {

            var gen = 0;
            var server = Http.createServer(function (req, res) {

                if (gen++ < 2) {
                    res.writeHead(301, { 'Location': 'http://localhost:' + server.address().port });
                    res.end();
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(payload);
                }
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, { redirects: 1 }, function (err, res) {

                    expect(err.message).to.equal('Maximum redirections reached');
                    server.close();
                    done();
                });
            });
        });

        it('handles malformed redirection response', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(301);
                res.end();
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, { redirects: 1 }, function (err, res) {

                    expect(err.message).to.equal('Received redirection without location');
                    server.close();
                    done();
                });
            });
        });

        it('handles redirections with POST stream payload', function (done) {

            var gen = 0;
            var server = Http.createServer(function (req, res) {

                if (!gen++) {
                    res.writeHead(307, { 'Location': '/' });
                    res.end();
                }
                else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    Nipple.read(req, function (err, res2) {

                        res.end(res2);
                    });
                }
            });

            server.listen(0, function () {

                Nipple.request('post', 'http://localhost:' + server.address().port, { redirects: 1, payload: Nipple.toReadableStream(payload) }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('handles request errors with a boom response', function (done) {

            var server = Http.createServer(function (req, res) {

                req.destroy();
                res.end();
            });

            server.once('listening', function () {

                Nipple.request('get', 'http://127.0.0.1:' + server.address().port, { payload: '' }, function (err) {

                    expect(err.code).to.equal('ECONNRESET');
                    done();
                });
            });

            server.listen(0);
        });

        it('handles request errors with a boom response when payload is being sent', function (done) {

            var server = Http.createServer(function (req, res) {

                req.destroy();
                res.end();
            });

            server.once('listening', function () {

                Nipple.request('get', 'http://127.0.0.1:' + server.address().port, { payload: '' }, function (err) {

                    expect(err.code).to.equal('ECONNRESET');
                    done();
                });
            });

            server.listen(0);
        });

        it('handles response errors with a boom response', function (done) {

            var server = Http.createServer(function (req, res) {

                res.destroy();
            });

            server.once('listening', function () {

                Nipple.request('get', 'http://127.0.0.1:' + server.address().port, { payload: '' }, function (err) {

                    expect(err.code).to.equal('ECONNRESET');
                    done();
                });
            });

            server.listen(0);
        });

        it('handles errors when remote server is unavailable', function (done) {

            Nipple.request('get', 'http://127.0.0.1:10', { payload: '' }, function (err) {

                expect(err).to.exist;
                done();
            });
        });

        it('handles a timeout during a socket close', function (done) {

            var server = Http.createServer(function (req, res) {

                req.once('error', function () { });
                res.once('error', function () { });

                setTimeout(function () {

                    req.destroy();
                }, 5);
            });

            server.once('error', function () { });

            server.once('listening', function () {

                Nipple.request('get', 'http://127.0.0.1:' + server.address().port, { payload: '', timeout: 5 }, function (err) {

                    expect(err).to.exist;
                    server.close();

                    setTimeout(done, 5);
                });
            });

            server.listen(0);
        });

        it('handles an error after a timeout', function (done) {

            var server = Http.createServer(function (req, res) {

                req.once('error', function () { });
                res.once('error', function () { });

                setTimeout(function () {

                    res.socket.write('ERROR');
                }, 5);
            });

            server.once('error', function () { });

            server.once('listening', function () {

                Nipple.request('get', 'http://127.0.0.1:' + server.address().port, { payload: '', timeout: 5 }, function (err) {

                    expect(err).to.exist;
                    server.close();

                    setTimeout(done, 5);
                });
            });

            server.listen(0);
        });

        it('allows request without a callback', function (done) {

            var server = Http.createServer(function (req, res) {

                res.end('ok');
            });

            server.once('listening', function () {

                Nipple.request('get', 'http://127.0.0.1:' + server.address().port);
                done();
            });

            server.listen(0);
        });

        it('uses agent option', function (done) {

            var agent = new Http.Agent();
            expect(Object.keys(agent.sockets).length).to.equal(0);

            Nipple.request('get', 'http://localhost/', { agent: agent }, function (err, res) {

                expect(Object.keys(agent.sockets).length).to.equal(1);
                done();
            });
        });

        it('requests payload in buffer', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                req.pipe(res);
            });

            server.listen(0, function () {

                var buf = new Buffer(payload, 'ascii');

                Nipple.request('post', 'http://localhost:' + server.address().port, { payload: buf }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal(payload);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('requests head method', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                req.pipe(res);
            });

            server.listen(0, function () {

                var buf = new Buffer(payload, 'ascii');

                Nipple.request('head', 'http://localhost:' + server.address().port, { payload: null }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal('');
                        server.close();
                        done();
                    });
                });
            });
        });

        it('post null payload', function (done) {

            var server = Http.createServer(function (req, res) {
                res.statusCode = 500;
                res.end();
            });

            server.listen(0, function () {

                Nipple.request('post', 'http://localhost:' + server.address().port, { headers: { connection: 'close' }, payload: null }, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, function (err, body) {

                        expect(err).to.not.exist;
                        expect(body.toString()).to.equal('');
                        server.close();
                        done();
                    });
                });
            });
        });

        it('handles read timeout', function (done) {

            var server = Http.createServer(function (req, res) {

                setTimeout(function () {

                    res.writeHead(200);
                    res.write(payload);
                    res.end();
                }, 2000);
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, { timeout: 100 }, function (err, res) {

                    expect(err).to.exist;
                    expect(err.output.statusCode).to.equal(504);
                    done();
                });
            });
        });

        it('cleans socket on agent deferred read timeout', function (done) {

            var complete;

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.write('foo');

                complete = complete || function () {

                    res.end();
                };
            });

            server.listen(0, function () {

                var agent = new Http.Agent({ maxSockets: 1 });
                expect(Object.keys(agent.sockets).length).to.equal(0);

                Nipple.request('get', 'http://localhost:' + server.address().port, { agent: agent, timeout: 10 }, function (err, res) {

                    expect(err).to.not.exist;
                    expect(Object.keys(agent.sockets).length).to.equal(1);
                    expect(Object.keys(agent.requests).length).to.equal(0);

                    Nipple.request('get', 'http://localhost:' + server.address().port + '/thatone', { agent: agent, timeout: 10 }, function (err, innerRes) {

                        expect(err).to.exist;
                        expect(err.output.statusCode).to.equal(504);

                        expect(Object.keys(agent.sockets).length).to.equal(1);
                        expect(Object.keys(agent.requests).length).to.equal(1);

                        complete();

                        Nipple.read(res, function () {

                            setTimeout(function () {

                                expect(Object.keys(agent.sockets).length).to.equal(0);
                                expect(Object.keys(agent.requests).length).to.equal(0);

                                done();
                            }, 100);
                        });
                    });
                });
            });
        });
    });

    describe('#read', function () {

        it('handles errors with a boom response', function (done) {

            var res = new Events.EventEmitter();
            res.pipe = function () { };

            Nipple.read(res, function (err) {

                expect(err.isBoom).to.equal(true);
                done();
            });

            res.emit('error', new Error('my error'));
        });

        it('handles responses that close early', function (done) {

            var res = new Events.EventEmitter();
            res.pipe = function () { };

            Nipple.read(res, function (err) {

                expect(err.isBoom).to.equal(true);
                done();
            });

            res.emit('close');
        });

        it('times out when stream read takes too long', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(payload);
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {}, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, { timeout: 100 }, function (err, body) {

                        expect(err).to.exist;
                        expect(err.output.statusCode).to.equal(408);
                        expect(body).to.not.exist;
                        server.close();
                        done();
                    });
                });
            });
        });

        it('errors when stream is too big', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.write(payload);
                res.end(payload);
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {}, function (err, res) {

                    expect(err).to.not.exist;
                    Nipple.read(res, { maxBytes: 120 }, function (err, body) {

                        expect(err).to.exist;
                        expect(err.output.statusCode).to.equal(400);
                        expect(body).to.not.exist;
                        server.close();
                        done();
                    });
                });
            });
        });

        it('reads a file streamed via HTTP', function (done) {

            var path = Path.join(__dirname, '../images/nipple.png');
            var stats = Fs.statSync(path);
            var fileStream = Fs.createReadStream(path);

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                fileStream.pipe(res);
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {}, function (err, res) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);

                    Nipple.read(res, function (err, body) {

                        expect(body.length).to.equal(stats.size);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('reads a multiple buffers response', function (done) {

            var path = Path.join(__dirname, '../images/nipple.png');
            var stats = Fs.statSync(path);
            var file = Fs.readFileSync(path);

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.write(file);
                setTimeout(function () {

                    res.write(file);
                    res.end();
                }, 100);
            });

            server.listen(0, function () {

                Nipple.request('get', 'http://localhost:' + server.address().port, {}, function (err, res) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);

                    Nipple.read(res, function (err, body) {

                        expect(body.length).to.equal(stats.size * 2);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('writes a file streamed via HTTP', function (done) {

            var path = Path.join(__dirname, '../images/nipple.png');
            var stats = Fs.statSync(path);
            var fileStream = Fs.createReadStream(path);

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);

                Nipple.read(req, function (err, body) {

                    res.end(body);
                });
            });

            server.listen(0, function () {

                Nipple.request('post', 'http://localhost:' + server.address().port, { payload: fileStream }, function (err, res) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);

                    Nipple.read(res, function (err, body) {

                        expect(body.length).to.equal(stats.size);
                        server.close();
                        done();
                    });
                });
            });
        });

        it('handles responses with no headers', function (done) {

            var res = Nipple.toReadableStream(payload);
            Nipple.read(res, { json: true }, function (err) {

                expect(err).to.equal(null);
                done();
            });
        });

    });

    describe('#parseCacheControl', function () {

        it('parses valid header', function (done) {

            var header = Nipple.parseCacheControl('must-revalidate, max-age=3600');
            expect(header).to.exist;
            expect(header['must-revalidate']).to.equal(true);
            expect(header['max-age']).to.equal(3600);
            done();
        });

        it('parses valid header with quoted string', function (done) {

            var header = Nipple.parseCacheControl('must-revalidate, max-age="3600"');
            expect(header).to.exist;
            expect(header['must-revalidate']).to.equal(true);
            expect(header['max-age']).to.equal(3600);
            done();
        });

        it('errors on invalid header', function (done) {

            var header = Nipple.parseCacheControl('must-revalidate, b =3600');
            expect(header).to.not.exist;
            done();
        });

        it('errors on invalid max-age', function (done) {

            var header = Nipple.parseCacheControl('must-revalidate, max-age=a3600');
            expect(header).to.not.exist;
            done();
        });
    });

    describe('Shortcut', function () {

        it('get request', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.end('ok');
            });

            server.listen(0, function () {

                Nipple.get('http://localhost:' + server.address().port, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.equal('ok');
                    server.close();
                    done();
                });
            });
        });

        it('post request', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.end('ok');
            });

            server.listen(0, function () {

                Nipple.post('http://localhost:' + server.address().port, { payload: '123' }, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.equal('ok');
                    server.close();
                    done();
                });
            });
        });

        it('put request', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.end('ok');
            });

            server.listen(0, function () {

                Nipple.put('http://localhost:' + server.address().port, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.equal('ok');
                    server.close();
                    done();
                });
            });
        });

        it('delete request', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.end('ok');
            });

            server.listen(0, function () {

                Nipple.delete('http://localhost:' + server.address().port, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.equal('ok');
                    server.close();
                    done();
                });
            });
        });

        it('errors on bad request', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.end('ok');
            });

            server.listen(0, function () {

                var port = server.address().port;
                server.close();

                Nipple.get('http://localhost:' + port, function (err, res, payload) {

                    expect(err).to.exist;
                    done();
                });
            });
        });
    });

    describe('json', function () {

        it('json requested and received', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ foo: 'bar' }));
            });

            server.listen(0, function () {

                var port = server.address().port;
                var options = {
                    json: true
                };

                Nipple.get('http://localhost:' + port, options, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.not.equal(null);
                    expect(payload.foo).to.exist;
                    server.close();
                    done();
                });
            });
        });

        it('json requested but not received - flag is ignored', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200);
                res.end('ok');
            });

            server.listen(0, function () {

                var port = server.address().port;
                var options = {
                    json: true
                };

                Nipple.get('http://localhost:' + port, options, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.not.equal(null);
                    server.close();
                    done();
                });
            });
        });

        it('invalid json received', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('ok');
            });

            server.listen(0, function () {

                var port = server.address().port;
                var options = {
                    json: true
                };

                Nipple.get('http://localhost:' + port, options, function (err, res, payload) {

                    expect(err).to.exist;
                    server.close();
                    done();
                });
            });
        });

        it('json not requested but received as string', function (done) {

            var server = Http.createServer(function (req, res) {

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ foo: 'bar' }));
            });

            server.listen(0, function () {

                var port = server.address().port;
                var options = {
                    json: false
                };

                Nipple.get('http://localhost:' + port, options, function (err, res, payload) {

                    expect(err).to.not.exist;
                    expect(res.statusCode).to.equal(200);
                    expect(payload).to.not.equal(null);
                    server.close();
                    done();
                });
            });
        });
    });

    describe('#toReadableStream', function () {

        it('handle empty payload', function (done) {

            var stream = Nipple.toReadableStream();
            expect(stream instanceof Stream).to.be.true;
            var read = stream.read();                           // Make sure read has no problems
            expect(read).to.be.null;
            done();
        });

        it('handle explicit encoding', function (done) {

            var data = 'Hello';
            var buf = new Buffer(data, 'ascii');
            var stream = Nipple.toReadableStream(data, 'ascii');
            expect(stream instanceof Stream).to.be.true;
            var read = stream.read();
            expect(read.toString()).to.equal(data);
            done();
        });
    });
});
