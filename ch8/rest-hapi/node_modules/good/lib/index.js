// Load modules

var Monitor = require('./monitor');


// Declare internals

var internals = {};


exports.register = function (plugin, options, next) {

    plugin.expose('monitor', new Monitor(plugin, options));
    return next();
};

