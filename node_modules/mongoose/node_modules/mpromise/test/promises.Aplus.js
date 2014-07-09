/**
 * Module dependencies.
 */

var Promise = require('../lib/promise');
var aplus = require('promises-aplus-tests');

// tests

var adapter = {};
adapter.fulfilled = function (value) {
  var p = new Promise;
  p.fulfill(value);
  return p;
};
adapter.rejected = function (reason) {
  var p = new Promise;
  p.reject(reason);
  return p;
}
adapter.deferred = function () {
  var p = new Promise;
  return {
    promise: p, reject: p.reject.bind(p), resolve: p.fulfill.bind(p)
  }
}

it("run A+ suite", function (done) {
  this.timeout(60000);
  aplus(adapter, {
    reporter: 'spec', slow: 1

//    , bail:true
//    , grep:'2.3.1: If `promise` and `x` refer to the same object, reject `promise` with a `TypeError` as the reason. via return from a fulfilled promise'
  }, function (err) {
    done(err);
  });
});

