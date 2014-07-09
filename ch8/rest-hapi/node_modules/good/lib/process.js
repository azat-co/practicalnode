// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


module.exports.Monitor = internals.ProcessMonitor = function () {

    Hoek.inheritAsync(internals.ProcessMonitor, process, ['uptime', 'memoryUsage']);
};


internals.ProcessMonitor.prototype.memory = function (callback) {

    return callback(null, process.memoryUsage());
};


internals.ProcessMonitor.prototype.delay = function (callback) {

    var bench = new Hoek.Bench();
    setImmediate(function () {

        return callback(null, bench.elapsed());
    });
};