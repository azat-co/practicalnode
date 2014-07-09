// Load modules

var Lab = require('lab');
var Catbox = require('..');
var Memcache = require('../lib/memcache');
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


Helper.testMemcache(function (available) {

    if (!available) {
        return;
    }

    describe('Memcache', function () {

        Common.test('memcache');

        it('throws an error if not created with new', function (done) {

            var fn = function () {

                var memcache = Memcache.Connection();
            };

            expect(fn).to.throw(Error);
            done();
        });

        describe('#constructor', function () {

            it('takes location as a string', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                expect(memcache.settings.location).to.equal(options.location);
                done();
            });

            it('takes location as an array', function (done) {

                var options = {
                    location: ['127.0.0.1:11211']
                };

                var memcache = new Memcache.Connection(options);

                expect(memcache.settings.location).to.equal(options.location);
                done();
            });

            it('takes location as an object', function (done) {

                var options = {
                    location: {
                        '127.0.0.1:11211': 1
                    }
                };

                var memcache = new Memcache.Connection(options);

                expect(memcache.settings.location).to.equal(options.location);
                done();
            });
        });

        describe('#start', function () {

            it('sets client to when the connection succeeds', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                memcache.start(function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.not.exist;
                    expect(memcache.client).to.exist;
                    done();
                });
            });

            it('reuses the client when a connection is already started', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                memcache.start(function (err) {

                    expect(err).to.not.exist;
                    var client = memcache.client;

                    memcache.start(function () {

                        expect(client).to.equal(memcache.client);
                        done();
                    });
                });
            });

            it('returns an error when connection fails', function (done) {

                var options = {
                    location: '127.0.0.1:11212',
                    timeout: 10,
                    idle: 10,
                    failures: 0,
                    retries: 0,
                    poolSize: 1
                };

                var memcache = new Memcache.Connection(options);

                memcache.start(function (err, result) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(memcache.client).to.not.exist;
                    done();
                });
            });

        });

        describe('#validateSegmentName', function () {

            it('returns an error when the name is empty', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName('');

                expect(result).to.be.instanceOf(Error);
                expect(result.message).to.equal('Empty string');
                done();
            });

            it('returns an error when the name has a null character', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName('\0test');

                expect(result).to.be.instanceOf(Error);
                done();
            });

            it('returns an error when the name has a space character', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName(' test');

                expect(result).to.be.instanceOf(Error);
                done();
            });

            it('returns no error when the name has an "s" character', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName('space');

                expect(result).to.not.exist;
                done();
            });

            it('returns an error when the name has a tab character', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName('\ttest');

                expect(result).to.be.instanceOf(Error);
                done();
            });

            it('returns an error when the name has a newline character', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName('\ntest');

                expect(result).to.be.instanceOf(Error);
                done();
            });

            it('returns null when there aren\'t any errors', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                var result = memcache.validateSegmentName('valid');

                expect(result).to.not.be.instanceOf(Error);
                expect(result).to.equal(null);
                done();
            });
        });

        describe('#get', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                memcache.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('passes an error to the callback when there is an error returned from getting an item', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);
                memcache.client = {
                    get: function (item, callback) {

                        callback(new Error());
                    }
                };

                memcache.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });

            it('passes an error to the callback when there is an error parsing the result', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);
                memcache.client = {
                    get: function (item, callback) {

                        callback(null, 'test');
                    }
                };

                memcache.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('Bad envelope content');
                    done();
                });
            });

            it('passes an error to the callback when there is an error with the envelope structure', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);
                memcache.client = {
                    get: function (item, callback) {

                        callback(null, '{ "item": "false" }');
                    }
                };

                memcache.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('Incorrect envelope structure');
                    done();
                });
            });

            it('is able to retrieve an object thats stored when connection is started', function (done) {

                var options = {
                    location: '127.0.0.1:11211',
                    partition: 'wwwtest'
                };
                var key = {
                    id: 'test',
                    segment: 'test'
                };

                var memcache = new Memcache.Connection(options);

                memcache.start(function () {

                    memcache.set(key, 'myvalue', 200, function (err) {

                        expect(err).to.not.exist;
                        memcache.get(key, function (err, result) {

                            expect(err).to.not.exist;
                            expect(result.item).to.equal('myvalue');
                            done();
                        });
                    });
                });
            });

            it('returns null when unable to find the item', function (done) {

                var options = {
                    location: '127.0.0.1:11211',
                    partition: 'wwwtest'
                };
                var key = {
                    id: 'notfound',
                    segment: 'notfound'
                };

                var memcache = new Memcache.Connection(options);

                memcache.start(function () {

                    memcache.get(key, function (err, result) {

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
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                memcache.set('test1', 'test1', 3600, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('passes an error to the callback when there is an error returned from setting an item', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);
                memcache.client = {
                    set: function (key, item, ttl, callback) {

                        callback(new Error());
                    }
                };

                memcache.set('test', 'test', 3600, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });
        });

        describe('#drop', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);

                memcache.drop('test2', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('deletes the item from redis', function (done) {

                var options = {
                    location: '127.0.0.1:11211'
                };

                var memcache = new Memcache.Connection(options);
                memcache.client = {
                    del: function (key, callback) {

                        callback(null, null);
                    }
                };

                memcache.drop('test', function (err) {

                    expect(err).to.not.exist;
                    done();
                });
            });
        });
    });

    describe('#stop', function () {

        it('sets the client to null', function (done) {

            var options = {
                location: '127.0.0.1:11211'
            };

            var memcache = new Memcache.Connection(options);

            memcache.start(function () {

                expect(memcache.client).to.exist;
                memcache.stop();
                expect(memcache.client).to.not.exist;
                done();
            });
        });
    });
});
