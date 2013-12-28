  // var assert = require('assert');
  var assert = require('chai').assert;
  describe('String#split', function(){
    it('should return an array', function(){
      assert(Array.isArray('a,b,c'.split(',')));
    });
    it('should return the same array', function(){
      assert.equal(['a','b','c'].length, 'a,b,c'.split(',').length, 'arrays have equal length');
      for (var i=0; i<['a','b','c'].length; i++) {
        assert.equal(['a','b','c'][i], 'a,b,c'.split(',')[i], i + 'element is equal');
      }
    })
  })