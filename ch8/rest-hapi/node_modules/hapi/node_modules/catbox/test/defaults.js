// Load modules

var Lab = require('lab');
var Catbox = require('..');
var Defaults = require('../lib/defaults');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Defaults', function () {

    describe('#cache', function () {

        it('throws when engine is false', function (done) {

            expect(function () {

                Defaults.apply(false);
            }).to.throw('Missing options');
            done();
        });

        it('throws when engine is set to \'extension\'', function (done) {

            expect(function () {

                Defaults.apply('extension');
            }).to.throw(Error);
            done();
        });

        it('doesn\'t throw when a custom engine is specified', function (done) {

            var customDefaults = Defaults.apply({ 'engine': {}, 'partition': 'gilden-yak' });

            expect(customDefaults.engine).to.equal('extension');
            expect(customDefaults.extension).to.deep.equal({});
            expect(customDefaults.partition).to.equal('gilden-yak');

            done();
        });

        it('doesn\'t throw when applying defaults to a custom engine multiple times', function (done) {

            var engineSettings = { 'engine': { 'yakStatus': 'shaven', 'hasColeSlaw': true } };
            var customDefaults = Defaults.apply(engineSettings);
            var reappliedDefaults = Defaults.apply(customDefaults);

            expect(reappliedDefaults.engine).to.equal('extension');
            expect(reappliedDefaults.partition).to.equal('catbox');
            expect(reappliedDefaults.extension).to.deep.equal({ 'yakStatus': 'shaven', 'hasColeSlaw': true });

            expect(reappliedDefaults).to.not.equal(customDefaults);
            expect(customDefaults).to.not.equal(engineSettings);

            done();
        });

        it('returns correct defaults for redis', function (done) {

            var redisDefaults = Defaults.apply('redis');

            expect(redisDefaults.port).to.equal(6379);
            done();
        });

        it('returns correct defaults for riak', function (done) {

            var riakDefaults = Defaults.apply('riak');

            expect(riakDefaults.port).to.equal(8087);
            done();
        });

        it('returns correct defaults for mongo', function (done) {

            var mongoDefaults = Defaults.apply('mongodb');

            expect(mongoDefaults.port).to.equal(27017);
            done();
        });

        it('returns correct defaults for memcache', function (done) {

            var memcacheDefaults = Defaults.apply('memcache');

            expect(memcacheDefaults.location).to.equal('127.0.0.1:11211');
            done();
        });


        it('takes a single host and port instead of location', function (done) {

            var options = {
                engine: 'memcache',
                host: '127.0.0.1',
                port: 11211
            };

            var memcacheDefaults = Defaults.apply(options);

            expect(memcacheDefaults.location).to.equal('127.0.0.1:11211');
            done();
        });

        it('throws when both location and host/port are given', function (done) {

            var options = {
                engine: 'memcache',
                location: '127.0.0.1:11211',
                host: '127.0.0.1',
                port: 11212
            };

            var fn = function () {

                var memcacheDefaults = Defaults.apply(options);
            };

            expect(fn).to.throw(Error);
            done();
        });

        it('throws when both location and host are given', function (done) {

            var options = {
                engine: 'memcache',
                location: '127.0.0.1:11211',
                host: '127.0.0.1'
            };

            var fn = function () {

                var memcacheDefaults = Defaults.apply(options);
            };

            expect(fn).to.throw(Error);
            done();
        });

        it('throws when both location and port are given', function (done) {

            var options = {
                engine: 'memcache',
                location: '127.0.0.1:11211',
                port: 11211
            };

            var fn = function () {

                var memcacheDefaults = Defaults.apply(options);
            };

            expect(fn).to.throw(Error);
            done();
        });
    });
});
