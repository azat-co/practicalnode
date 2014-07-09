// Load modules

var Lab = require('lab');
var Catbox = require('..');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Client', function () {

    it('throws an error if using an unknown engine type', function (done) {

        var fn = function () {

            var options = {
                engine: 'bob'
            };

            var client = new Catbox.Client(options);
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('doesn\'t initialize client when engine is none', function (done) {

        var fn = function () {

            var client = new Catbox.Client('none');
        };

        expect(fn).to.throw(Error);
        done();
    });

    it('returns error when calling get on a bad connection', function (done) {

        var failOn = function (method) {

            var err = new Error('FAIL');
            var errorEngineImp = {

                start: function (callback) { callback(method === 'start' ? err : null); },
                stop: function () { },
                isReady: function () { return method !== 'isReady'; },
                validateSegmentName: function () { return method === 'validateSegmentName' ? err : null; },
                get: function (key, callback) { return callback(method === 'get' ? err : null); },
                set: function (key, value, ttl, callback) { return callback(method === 'set' ? err : null); },
                drop: function (key, callback) { return callback(method === 'drop' ? err : null); }
            };

            var options = {
                engine: errorEngineImp,
                partition: 'hapi-cache'
            };

            return new Catbox.Client(options);
        };

        var client = failOn('get');
        var key = { id: 'x', segment: 'test' };
        client.get(key, function (err, result) {

            expect(err).to.exist;
            expect(err.message).to.equal('FAIL');
            done();
        });
    });

    describe('Extension', function () {

        it('should allow defaults to be applied multiple times', function (done) {
            var options = {
                partition: 'test',
                engine: {
                    start: function (callback) {

                        callback();
                    }
                }
            };

            var defaultOptions = Catbox.defaults.apply(options);
            var client = new Catbox.Client(defaultOptions);

            client.start(function (err) {

                expect(err).to.not.exist;
                done();
            });
        });

        describe('#start', function () {

            it('passes an error in the callback when one occurs', function (done) {

                var options = {
                    partition: 'test',
                    engine: {
                        start: function (callback) {

                            callback(new Error());
                        }
                    }
                };

                var client = new Catbox.Client(options);
                client.start(function (err) {

                    expect(err).to.exist;
                    done();
                });
            });
        });

        describe('#get', function () {

            it('returns an error when the connection is not ready', function (done) {

                var options = {
                    partition: 'test',
                    engine: {
                        start: function (callback) {

                            callback();
                        },
                        isReady: function () {

                            return false;
                        }
                    }
                };

                var client = new Catbox.Client(options);
                client.get('test', function (err) {

                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Disconnected');
                    done();
                });
            });

            it('wraps the result with cached details', function (done) {

                var options = {
                    partition: 'test',
                    engine: {
                        start: function (callback) {

                            callback();
                        },
                        isReady: function () {

                            return true;
                        },
                        get: function (key, callback) {

                            var result = {
                                item: 'test1',
                                stored: 'test2'
                            };

                            callback(null, result);
                        }
                    }
                };

                var client = new Catbox.Client(options);
                client.get({ id: 'id', segment: 'segment' }, function (err, cached) {

                    expect(cached.item).to.equal('test1');
                    expect(cached.stored).to.equal('test2');
                    expect(cached.ttl).to.exist;
                    done();
                });
            });
        });

        describe('#set', function () {

            it('returns an error when the connection is not ready', function (done) {

                var options = {
                    partition: 'test',
                    engine: {
                        start: function (callback) {

                            callback();
                        },
                        isReady: function () {

                            return false;
                        }
                    }
                };

                var client = new Catbox.Client(options);
                client.set('test', 'test', 'test', function (err) {

                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Disconnected');
                    done();
                });
            });
        });

        describe('#drop', function () {

            it('calls the extension clients drop function', function (done) {

                var options = {
                    partition: 'test',
                    engine: {
                        start: function (callback) {

                            callback();
                        },
                        isReady: function () {

                            return true;
                        },
                        drop: function (key, callback) {

                            callback(null, 'success');
                        }
                    }
                };

                var client = new Catbox.Client(options);
                client.drop({ id: 'id', segment: 'segment' }, function (err, result) {

                    expect(result).to.equal('success');
                    done();
                });
            });
        });
    });
});