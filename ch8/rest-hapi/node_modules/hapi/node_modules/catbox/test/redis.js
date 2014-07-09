// Load modules

var Lab = require('lab');
var Catbox = require('..');
var Redis = require('../lib/redis');
var Helper = require('./helper');
var Common = require('./common');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


Helper.testRedis(function (available) {

    if (!available) {
        return;
    }

    describe('Redis', function () {

        Common.test('redis');

        it('throws an error if not created with new', function (done) {

            var fn = function () {

                var redis = Redis.Connection();
            };

            expect(fn).to.throw(Error);
            done();
        });

        describe('#start', function () {

            it('sets client to when the connection succeeds', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                redis.start(function (err) {

                    expect(err).to.not.exist;
                    expect(redis.client).to.exist;
                    done();
                });
            });

            it('reuses the client when a connection is already started', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                redis.start(function (err) {

                    expect(err).to.not.exist;
                    var client = redis.client;

                    redis.start(function () {

                        expect(client).to.equal(redis.client);
                        done();
                    });
                });
            });

            it('returns an error when connection fails', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6380
                };

                var redis = new Redis.Connection(options);

                redis.start(function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(redis.client).to.not.exist;
                    done();
                });
            });

            it('sends auth command when password is provided', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379,
                    password: 'wrongpassword'
                };

                var redis = new Redis.Connection(options);

                var log = console.log;
                console.log = function (message) {

                    expect(message).to.contain('Warning');
                    console.log = log;
                };

                redis.start(function (err) {
                    done();
                });
            });

            it('stops the client on error post connection', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                redis.start(function (err) {

                    expect(err).to.not.exist;
                    expect(redis.client).to.exist;

                    redis.client.emit('error', new Error('injected'));
                    expect(redis.client).to.not.exist;
                    done();
                });
            });
        });

        describe('#validateSegmentName', function () {

            it('returns an error when the name is empty', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                var result = redis.validateSegmentName('');

                expect(result).to.be.instanceOf(Error);
                expect(result.message).to.equal('Empty string');
                done();
            });

            it('returns an error when the name has a null character', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                var result = redis.validateSegmentName('\0test');

                expect(result).to.be.instanceOf(Error);
                done();
            });

            it('returns null when there aren\'t any errors', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                var result = redis.validateSegmentName('valid');

                expect(result).to.not.be.instanceOf(Error);
                expect(result).to.equal(null);
                done();
            });
        });

        describe('#get', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                redis.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('passes an error to the callback when there is an error returned from getting an item', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);
                redis.client = {
                    get: function (item, callback) {

                        callback(new Error());
                    }
                };

                redis.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });

            it('passes an error to the callback when there is an error parsing the result', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);
                redis.client = {
                    get: function (item, callback) {

                        callback(null, 'test');
                    }
                };

                redis.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('Bad envelope content');
                    done();
                });
            });

            it('passes an error to the callback when there is an error with the envelope structure', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);
                redis.client = {
                    get: function (item, callback) {

                        callback(null, '{ "item": "false" }');
                    }
                };

                redis.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('Incorrect envelope structure');
                    done();
                });
            });

            it('is able to retrieve an object thats stored when connection is started', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379,
                    partition: 'wwwtest'
                };
                var key = {
                    id: 'test',
                    segment: 'test'
                };

                var redis = new Redis.Connection(options);

                redis.start(function () {

                    redis.set(key, 'myvalue', 200, function (err) {

                        expect(err).to.not.exist;
                        redis.get(key, function (err, result) {

                            expect(err).to.not.exist;
                            expect(result.item).to.equal('myvalue');
                            done();
                        });
                    });
                });
            });

            it('returns null when unable to find the item', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379,
                    partition: 'wwwtest'
                };
                var key = {
                    id: 'notfound',
                    segment: 'notfound'
                };

                var redis = new Redis.Connection(options);

                redis.start(function () {

                    redis.get(key, function (err, result) {

                        expect(err).to.not.exist;
                        expect(result).to.not.exist;
                        done();
                    });
                });
            });
        });

        describe('#set', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                redis.set('test1', 'test1', 3600, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('passes an error to the callback when there is an error returned from setting an item', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);
                redis.client = {
                    set: function (key, item, callback) {

                        callback(new Error());
                    }
                };

                redis.set('test', 'test', 3600, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });
        });

        describe('#drop', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);

                redis.drop('test2', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('deletes the item from redis', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 6379
                };

                var redis = new Redis.Connection(options);
                redis.client = {
                    del: function (key, callback) {

                        callback(null, null);
                    }
                };

                redis.drop('test', function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });
    });

    describe('#stop', function () {

        it('sets the client to null', function (done) {

            var options = {
                host: '127.0.0.1',
                port: 6379
            };

            var redis = new Redis.Connection(options);

            redis.start(function () {

                expect(redis.client).to.exist;
                redis.stop();
                expect(redis.client).to.not.exist;
                done();
            });
        });
    });
});
