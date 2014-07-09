// Load modules

var Lab = require('lab');
var Catbox = require('..');
var Riak = require('../lib/riak');
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


Helper.testRiak(function (available) {

    if (!available) {
        return;
    }

    describe('Riak', function () {

        Common.test('riak');

        it('throws an error if not created with new', function (done) {

            var fn = function () {

                var riak = Riak.Connection();
            };

            expect(fn).to.throw(Error);
            done();
        });

        describe('#start', function () {

            it('sets client to when the connection succeeds', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);

                riak.start(function (err, result) {

                    expect(err).to.not.exist;
                    expect(result).to.not.exist;
                    expect(riak.client).to.exist;
                    done();
                });
            });

            it('reuses the client when a connection is already started', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);

                riak.start(function (err) {

                    expect(err).to.not.exist;
                    var client = riak.client;

                    riak.start(function () {

                        expect(client).to.equal(riak.client);
                        done();
                    });
                });
            });
        });

        describe('#validateSegmentName', function () {

            it('returns an error when the name is empty', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);

                var result = riak.validateSegmentName('');

                expect(result).to.be.instanceOf(Error);
                expect(result.message).to.equal('Empty string');
                done();
            });

            it('returns an error when the name has a null character', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);

                var result = riak.validateSegmentName('\0test');

                expect(result).to.be.instanceOf(Error);
                done();
            });

            it('returns null when there aren\'t any errors', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);

                var result = riak.validateSegmentName('valid');

                expect(result).to.not.be.instanceOf(Error);
                expect(result).to.equal(null);
                done();
            });
        });

        describe('#get', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);

                riak.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('passes an error to the callback when there is an error returned from getting an item', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);
                riak.client = {
                    get: function (item, callback) {

                        callback(new Error());
                    }
                };

                riak.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });

            it('passes an error to the callback when there is an error parsing the result', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);
                riak.client = {
                    get: function (item, callback) {

                        callback(null, { content: [{ value: 'test' }] });
                    }
                };

                riak.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('Bad envelope content');
                    done();
                });
            });

            it('passes an error to the callback when there is an error with the envelope structure', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);
                riak.client = {
                    get: function (item, callback) {

                        callback(null, { content: [{ value: '{ "item": "false" }' }] });
                    }
                };

                riak.get('test', function (err) {

                    expect(err).to.exist;
                    expect(err.message).to.equal('Incorrect envelope structure');
                    done();
                });
            });

            it('is able to retrieve an object thats stored when connection is started', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'wwwtest'
                };
                var key = {
                    id: 'test',
                    segment: 'test'
                };

                var riak = new Riak.Connection(options);

                riak.start(function () {

                    riak.set(key, 'myvalue', 200, function (err) {

                        expect(err).to.not.exist;
                        riak.get(key, function (err, result) {

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
                    port: 8087,
                    partition: 'wwwtest'
                };
                var key = {
                    id: 'notfound',
                    segment: 'notfound'
                };

                var riak = new Riak.Connection(options);

                riak.start(function () {

                    riak.get(key, function (err, result) {

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
                    port: 8087,
                    partition: 'errortest'
                };

                var riak = new Riak.Connection(options);

                riak.set('test1', 'test1', 3600, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('test for proper ttl bubbling', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'ttltest'
                };

                var riak = new Riak.Connection(options);
                riak.start(function () {

                    riak.set('test1', 'test1', 3600, function (err) {

                        expect(err).to.not.exist;

                        riak.set('test2', 'test2', 300, function (err) {

                            expect(err).to.not.exist;
                            done();
                        });
                    });
                });
            });

            it('passes an error to the callback when there is an error returned from setting an item', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'errortest'
                };

                var riak = new Riak.Connection(options);
                riak.client = {
                    put: function (key, callback) {

                        callback(new Error());
                    },
                    getIndex: function () {
                        var fakestream = new require('stream').Readable({ objectMode: true });
                        fakestream._read = function () { 
                            this.push({ keys: ['a'] });
                            this.push(null);
                        };
                        return fakestream;
                    },
                    del: function (q, cb) {
                        cb();
                    }
                };

                riak.set('test', 'test', 3600, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });

            it('deletes an expired key in a timely manner', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'expiretest'
                };

                var riak = new Riak.Connection(options);
                riak.client = {
                    put: function (key, callback) {

                        callback();
                    },
                    getIndex: function () {

                        var fakestream = new require('stream').Readable({ objectMode: true });
                        fakestream._read = function () { 
                            this.push({ keys: ['a'] });
                            this.push(null);
                        };
                        return fakestream;
                    },
                    del: function (q, cb) {
                        cb();
                        done();
                    }
                };
                riak.start(function () {

                    riak.set('test', 'test', 200, function (err) {

                        expect(err).to.not.exist;
                    });
                });
            });
        });

        describe('#drop', function () {

            it('passes an error to the callback when the connection is closed', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'errortest'
                };

                var riak = new Riak.Connection(options);

                riak.drop('test2', function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    expect(err.message).to.equal('Connection not started');
                    done();
                });
            });

            it('deletes the item from riak', function (done) {

                var options = {
                    host: '127.0.0.1',
                    port: 8087,
                    partition: 'test'
                };

                var riak = new Riak.Connection(options);
                riak.client = {
                    del: function (key, callback) {

                        callback(null, null);
                    }
                };

                riak.drop('test', function (err) {

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
                port: 8087,
                partition: 'test'
            };

            var riak = new Riak.Connection(options);

            riak.start(function () {

                expect(riak.client).to.exist;
                riak.stop();
                expect(riak.client).to.not.exist;
                done();
            });
        });
    });
});
