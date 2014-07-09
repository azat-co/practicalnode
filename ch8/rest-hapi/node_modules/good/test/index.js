// Load modules

var Lab = require('lab');
var Hapi = require('hapi');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Plugin', function () {

    it('emits ops data', function (done) {

        var server = new Hapi.Server();

        var options = {
            subscribers: {},
            opsInterval: 100,
            alwaysMeasureOps: true
        };

        server.pack.require('..', options, function (err) {

            expect(err).to.not.exist;

            server.plugins.good.monitor.once('ops', function (event) {

                expect(event.osload).to.exist;
                done();
            });
        });
    });
});


