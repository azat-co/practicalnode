var Promise = require('../')
  , Domain = require('domain')
  , assert = require('assert');

var next = 'function' == typeof setImmediate
  ? setImmediate
  : process.nextTick;

describe("domains", function () {
  it("exceptions should not breakout of domain bounderies", function (done) {
    if (process.version.indexOf('v0.8') == 0) return done();
    var d = Domain.create();
    d.once('error', function (err) {
      assert.equal(err.message, 'gaga');
      done()
    });

    var p = new Promise();

    d.run(function () {
      p.then(function () {

      }).then(function () {
          throw new Error('gaga');
        }).end();
    });

    next(function () {
      p.fulfill();
    })
  });
});
