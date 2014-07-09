// Load modules

var Lab = require('lab');
var ChildProcess = require('child_process');
var Fs = require('fs');
var Path = require('path');
var Hoek = require('hoek');
var Http = require('http');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;

describe('Replay', function () {

    var replayPath = Path.join(__dirname, '..', 'bin', 'replay');
    var logPath1 = Path.join(__dirname, 'replay.001');
    var data1 = '{"event":"request","timestamp":1369328752975,"id":"1369328752975-42369-3828","instance":"http://localhost:8080","labels":["api","http"],' +
        '"method":"get","path":"/test","query":{},"source":{"remoteAddress":"127.0.0.1"},"responseTime":71,"statusCode":200}';
    var data2 = '{"event":"request","timestamp":1369328753222,"id":"1369328753222-42369-62002","instance":"http://localhost:8080","labels":["api","http"],' +
        '"method":"get","path":"/test","query":{},"source":{"remoteAddress":"127.0.0.1"},"responseTime":9,"statusCode":200}';

    before(function (done) {

        if (Fs.existsSync(logPath1)) {
            Fs.unlinkSync(logPath1);
        }

        done();
    });

    after(function (done) {

        if (Fs.existsSync(logPath1)) {
            Fs.unlinkSync(logPath1);
        }

        done();
    });

    it('makes a request to the provided good log requests', function (done) {

        var replay = null;
        var stream = Fs.createWriteStream(logPath1, { flags: 'a' });
        stream.write(data1, function () {
            stream.write('\n' + data2, function () {

                var server = Http.createServer(function (req, res) {

                    expect(req.url).to.equal('/test');
                    res.end('Content-Type: text/plain');
                    replay.kill(0);
                });

                server.once('listening', function () {

                    var url = 'http://127.0.0.1:' + server.address().port + '/';

                    replay = ChildProcess.spawn('node', [replayPath, '-l', logPath1, '-u', url]);
                    replay.stderr.once('data', function (data) {

                        expect(data.toString()).to.not.exist;
                    });

                    replay.once('close', done);
                });

                server.listen(0);
            });
        });
    });

    it('handles request errors', function (done) {

        var replay = null;
        var stream = Fs.createWriteStream(logPath1, { flags: 'a' });
        stream.write(data1, function () {
            stream.write('\n' + data2, function () {

                var server = Http.createServer(function (req, res) {

                    req.socket.destroy();
                });

                server.once('listening', function () {

                    var url = 'http://127.0.0.1:' + server.address().port + '/';

                    replay = ChildProcess.spawn('node', [replayPath, '-l', logPath1, '-u', url]);
                    replay.stderr.once('data', function (data) {

                        expect(data.toString()).to.exist;
                        replay.kill(0);
                        done();
                    });
                });

                server.listen(0);
            });
        });
    });

    it('handles response errors', function (done) {

        var replay = null;
        var stream = Fs.createWriteStream(logPath1, { flags: 'a' });
        stream.write(data1, function () {
            stream.write('\n' + data2, function () {

                var server = Http.createServer(function (req, res) {

                    res.socket.destroy();
                });

                server.once('listening', function () {

                    var url = 'http://127.0.0.1:' + server.address().port + '/';

                    replay = ChildProcess.spawn('node', [replayPath, '-l', logPath1, '-u', url]);
                    replay.stderr.once('data', function (data) {

                        expect(data.toString()).to.exist;
                        replay.kill(0);
                        done();
                    });
                });

                server.listen(0);
            });
        });
    });
});


