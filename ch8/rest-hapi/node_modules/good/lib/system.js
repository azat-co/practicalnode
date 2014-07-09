// Load modules

var Os = require('os');
var Hoek = require('hoek');


// Declare internals

var internals = {};


module.exports.Monitor = internals.OSMonitor = function () {

    Hoek.inheritAsync(internals.OSMonitor, Os, ['loadavg', 'uptime', 'freemem', 'totalmem', 'cpus']);
};


internals.OSMonitor.prototype.mem = function (callback) {

    callback(null, {
        total: Os.totalmem(),
        free: Os.freemem()
    });
};
