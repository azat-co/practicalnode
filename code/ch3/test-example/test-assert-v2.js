var assert = require('assert')
var expected, current

before(() => {
  expected = ['a', 'b', 'c']
})

describe('String#split', () => {

  beforeEach(() => {
    current = 'a,b,c'.split(',')
  })

  it('should return an array', () => {
    assert(Array.isArray(current))
  })

  it('should return the same array', () => {
    assert.equal(expected.length, 
      current.length, 
      'arrays have equal length')
    for (let i = 0; i < expected.length; i++) {
      assert.equal(expected[i], 
        current[i], 
        `i element is equal`)
    }
  })    

})