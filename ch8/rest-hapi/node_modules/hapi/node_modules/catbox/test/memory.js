// Load modules

var Lab = require('lab');
var Catbox = require('..');
var Memory = require('../lib/memory');
var Common = require('./common');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Memory', function () {

    Common.test('memory');

    describe('#Connection', function () {

        it('throws an error when constructed without new', function (done) {

            var fn = function () {

                var memory = Memory.Connection();
            };

            expect(fn).to.throw(Error);
            done();
        });

        it('constructs a new Connection when constructed with new', function (done) {

            var fn = function () {

                var memory = new Memory.Connection();
            };

            expect(fn).to.not.throw(Error);
            done();
        });
    });

    describe('#start', function () {

        it('creates an empty cache object', function (done) {

            var memory = new Memory.Connection();
            expect(memory.cache).to.not.exist;
            memory.start(function () {

                expect(memory.cache).to.exist;
                done();
            });
        });
    });

    describe('#stop', function () {

        it('sets the cache object to null', function (done) {

            var memory = new Memory.Connection();
            expect(memory.cache).to.not.exist;
            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.stop();
                expect(memory.cache).to.not.exist;
                done();
            });
        });
    });

    describe('#get', function () {

        it('returns error on invalid json in cache', function (done) {

            var key = {
                segment: 'test',
                id: 'test'
            };

            var memory = new Memory.Connection();
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key, 'myvalue', 10, function () {

                    expect(memory.cache[key.segment][key.id].item).to.equal('"myvalue"');
                    memory.cache[key.segment][key.id].item = '"myvalue';
                    memory.get(key, function (err, result) {

                        expect(err.message).to.equal('Bad value content');
                        done();
                    });
                });
            });
        });
    });

    describe('#set', function () {

        it('adds an item to the cache object', function (done) {

            var key = {
                segment: 'test',
                id: 'test'
            };

            var memory = new Memory.Connection();
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key, 'myvalue', 10, function () {

                    expect(memory.cache[key.segment][key.id].item).to.equal('"myvalue"');
                    done();
                });
            });
        });

        it('removes an item from the cache object when it expires', function (done) {

            var key = {
                segment: 'test',
                id: 'test'
            };

            var memory = new Memory.Connection();
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key, 'myvalue', 10, function () {

                    expect(memory.cache[key.segment][key.id].item).to.equal('"myvalue"');
                    setTimeout(function () {

                        expect(memory.cache[key.segment][key.id]).to.not.exist;
                        done();
                    }, 15);
                });
            });
        });

        it('returns an error when the maxByteSize has been reached', function (done) {

            var key = {
                segment: 'test',
                id: 'test'
            };

            var memory = new Memory.Connection({ maxByteSize: 4 });
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key, 'myvalue', 10, function (err) {

                    expect(err).to.exist;
                    expect(err).to.be.instanceOf(Error);
                    done();
                });
            });
        });

        it('increments the byte size when an item is inserted and returns an error when the limit is reached', function (done) {

            var key1 = {
                segment: 'test',
                id: 'test'
            };

            var key2 = {
                segment: 'test',
                id: 'test2'
            };

            var memory = new Memory.Connection({ maxByteSize: 70 });
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key1, 'my', 10, function () {

                    expect(memory.cache[key1.segment][key1.id].item).to.equal('"my"');

                    memory.set(key2, 'myvalue', 10, function (err) {

                        expect(err).to.exist;
                        done();
                    });
                });
            });
        });

        it('increments the byte size when an object is inserted', function (done) {

            var key1 = {
                segment: 'test',
                id: 'test'
            };
            var itemToStore = {
                my: {
                    array: [1, 2, 3],
                    bool: true,
                    string: 'test'
                }
            };

            var memory = new Memory.Connection({ maxByteSize: 2000 });
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key1, itemToStore, 10, function () {

                    expect(memory.cache[key1.segment][key1.id].byteSize).to.equal(113);
                    expect(memory.cache[key1.segment][key1.id].item).to.exist;
                    done();
                });
            });
        });

        it('leaves the byte size unchanged when an object overrides existing key with same size', function (done) {

            var key1 = {
                segment: 'test',
                id: 'test'
            };
            var itemToStore = {
                my: {
                    array: [1, 2, 3],
                    bool: true,
                    string: 'test',
                    undefined: undefined
                }
            };

            var memory = new Memory.Connection({ maxByteSize: 2000 });
            expect(memory.cache).to.not.exist;

            memory.start(function () {

                expect(memory.cache).to.exist;
                memory.set(key1, itemToStore, 10, function () {

                    expect(memory.cache[key1.segment][key1.id].byteSize).to.equal(113);
                    expect(memory.cache[key1.segment][key1.id].item).to.exist;
                    memory.set(key1, itemToStore, 10, function () {

                        expect(memory.cache[key1.segment][key1.id].byteSize).to.equal(113);
                        expect(memory.cache[key1.segment][key1.id].item).to.exist;
                        done();
                    });
                });
            });
        });
    });
});
