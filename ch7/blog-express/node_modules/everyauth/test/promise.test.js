var expect = require('expect.js')
  , Promise = require('../lib/promise');

describe('Promise', function () {
  describe('#fulfill', function () {
    it('should be idempotent', function (done) {
      var p = new Promise()
        , test = null;
      p.callback( function (val) {
        test = val;
      });
      p.fulfill(1);
      p.fulfill(2);
      setTimeout( function () {
        expect(test).to.equal(1);
        done();
      }, 1000);
    });

    it('should not have an effect if #fail was already called', function (done) {
      var p = new Promise();
      p.fail(new Error());
      var fulfillHasImpact = false;
      p.callback( function () {
        fulfillHasImpact = true;
      });
      setTimeout( function () {
        p.fulfill(1);
        expect(fulfillHasImpact).to.not.be.ok();
        done();
      }, 1000);
    });

    it('should not have an effect if the promise already timed out', function (done) {
      var p = new Promise;
      p.timeout(1);
      var fulfillHasImpact = false;
      p.callback( function () {
        fulfillHasImpact = true;
      });
      setTimeout( function () {
        p.fulfill(1);
        expect(fulfillHasImpact).to.not.be.ok();
        done();
      }, 200);
    });
  });
});
