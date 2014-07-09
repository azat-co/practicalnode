// Load modules

var Lab = require('lab');
var ProcessMonitor = require('../lib/process');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Lab.expect;
var before = Lab.before;
var after = Lab.after;
var describe = Lab.experiment;
var it = Lab.test;


describe('Process Monitor', function () {

    describe('#memory', function () {

        it('passes the current memory usage to the callback', function (done) {

            var monitor = new ProcessMonitor.Monitor();
            monitor.memory(function (err, mem) {

                expect(err).not.to.exist;
                expect(mem).to.exist;
                done();
            });
        });
    });

    describe('#delay', function () {

        it('passes the current event queue delay to the callback', function (done) {

            var monitor = new ProcessMonitor.Monitor();
            monitor.delay(function (err, delay) {

                expect(err).not.to.exist;
                expect(delay).to.exist;
                done();
            });
        });
    });
});