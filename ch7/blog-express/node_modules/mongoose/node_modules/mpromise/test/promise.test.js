/*global describe,it */
if (process.version.indexOf('v0.11') == -1) require("longjohn");
/**
 * Module dependencies.
 */

var assert = require('assert');
var Promise = require('../');

/**
 * Test.
 */

describe('promise', function(){
  it('events fire right after fulfill()', function(done){
    var promise = new Promise()
      , called = 0;

    promise.on('fulfill', function (a, b) {
      assert.equal(a, '1');
      assert.equal(b, '2');
      called++;
    });

    promise.fulfill('1', '2');

    promise.on('fulfill', function (a, b) {
      assert.equal(a, '1');
      assert.equal(b, '2');
      called++;
    });

    assert.equal(2, called);
    done();
  });

  it('events fire right after reject()', function(done){
    var promise = new Promise()
      , called = 0;

    promise.on('reject', function (err) {
      assert.ok(err instanceof Error);
      called++;
    });

    promise.reject(new Error('booyah'));

    promise.on('reject', function (err) {
      assert.ok(err instanceof Error);
      called++;
    });

    assert.equal(2, called);
    done()
  });

  describe('onResolve()', function(){
    it('from constructor works', function(done){
      var called = 0;

      var promise = new Promise(function (err) {
        assert.ok(err instanceof Error);
        called++;
      })

      promise.reject(new Error('dawg'));

      assert.equal(1, called);
      done();
    });

    it('after fulfill()', function(done){
      var promise = new Promise()
        , called = 0;

      promise.fulfill('woot');

      promise.onResolve(function (err, data){
        assert.equal(data,'woot');
        called++;
      });

      promise.onResolve(function (err, data){
        assert.strictEqual(err, null);
        called++;
      });

      assert.equal(2, called);
      done();
    })
  });

  describe('onFulfill shortcut', function(){
    it('works', function(done){
      var promise = new Promise()
        , called = 0;

      promise.onFulfill(function (woot) {
        assert.strictEqual(woot, undefined);
        called++;
      });

      promise.fulfill();

      assert.equal(1, called);
      done();
    })
  })

  describe('onReject shortcut', function(){
    it('works', function(done){
      var promise = new Promise()
        , called = 0;

      promise.onReject(function (err) {
        assert.ok(err instanceof Error);
        called++;
      });

      promise.reject(new Error);
      assert.equal(1, called);
      done();
    })
  });

  describe('return values', function(){
    it('on()', function(done){
      var promise = new Promise()
      assert.ok(promise.on('jump', function(){}) instanceof Promise);
      done()
    });

    it('onFulfill()', function(done){
      var promise = new Promise()
      assert.ok(promise.onFulfill(function(){}) instanceof Promise);
      done();
    })
    it('onReject()', function(done){
      var promise = new Promise()
      assert.ok(promise.onReject(function(){}) instanceof Promise);
      done();
    })
    it('onResolve()', function(done){
      var promise = new Promise()
      assert.ok(promise.onResolve(function(){}) instanceof Promise);
      done();
    })
  })

  describe('casting errors', function(){
    describe('reject()', function(){
      it('does not cast arguments to Error', function(done){
        var p = new Promise(function (err, arg) {
          assert.equal(3, err);
          done();
        });

        p.reject(3);
      })
    })
  })

  describe('then', function(){
    describe('catching', function(){
      it('should not catch returned promise fulfillments', function(done){
        var errorSentinal
          , p = new Promise
          , p2 = p.then(function () { throw errorSentinal = new Error("boo!") });

        p.fulfill();
        done();
      });


      it('should not catch returned promise fulfillments even async', function (done) {
        var errorSentinal
          , p = new Promise
          , p2 = p.then(function () { throw errorSentinal = new Error("boo!") });

        setTimeout(function () {
          p.fulfill();
          done();
        }, 10);
      });


      it('can be disabled using .end()', function(done){
        if (process.version.indexOf('v0.8') == 0) return done();
        var errorSentinal
          , overTimeout
          , domain = require('domain').create();

        domain.once('error', function (err) {
          assert(err, errorSentinal);
          clearTimeout(overTimeout);
          done()
        });

        domain.run(function () {
          var p = new Promise;
          var p2 = p.then(function () {
            throw errorSentinal = new Error('shucks')
          });
          p2.end();

          p.fulfill();
        });
        overTimeout = setTimeout(function () { done(new Error('error was swallowed')); }, 10);
      });


      it('can be disabled using .end() even when async', function (done) {
        if (process.version.indexOf('v0.8') == 0) return done();
        var errorSentinal
          , overTimeout
          , domain = require('domain').create();

        domain.on('error', function (err) {
          assert(err, errorSentinal);
          clearTimeout(overTimeout);
          done()
        });

        domain.run(function () {
          var p = new Promise;
          var p2 = p.then(function () {
            throw errorSentinal = new Error("boo!")
          });
          p2.end();

          setTimeout(function () {p.fulfill();}, 10);
        });
        overTimeout = setTimeout(function () { done(new Error('error was swallowed')); }, 20);
      });


      it('can be handled using .end() so no throwing', function (done) {
        var errorSentinal
          , overTimeout
          , domain = require('domain').create();

        domain.run(function () {
          var p = new Promise;
          var p2 = p.then(function () {
            throw errorSentinal = new Error("boo!")
          });
          p2.end(function (err) {
            assert.equal(err, errorSentinal);
            clearTimeout(overTimeout);
            done()
          });

          setTimeout(function () {p.fulfill();}, 10);
        });
        overTimeout = setTimeout(function () { done(new Error('error was swallowed')); }, 20);
      });

    });

    it('persistent', function(done){
      var p = new Promise
          v = null;

      function ensure (val) {
        v = v || val;
        assert.equal(v, val);
      }

      function guard () {
        throw new Error('onReject should not be called');
      }

      p.then(ensure, guard).end();

      p.fulfill('foo');
      p.fulfill('bar');
      p.reject(new Error('baz'));

      p.then(ensure, guard).end();

      setTimeout(done, 0);
    })


    it('accepts multiple completion values', function(done){
      var p = new Promise;

      p.then(function (a, b) {
        assert.equal(2, arguments.length);
        assert.equal('hi', a);
        assert.equal(4, b);
        done();
      }, done).end();

      p.fulfill('hi', 4);
    })
  });


  describe('end', function () {
    it("should return the promise", function (done) {
      var p = new Promise;
      var p1 = p.end();
      assert.equal(p, p1);
      done();
    });
  });


});
