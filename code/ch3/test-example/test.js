const assert = require('assert')
// const assert = require('chai').assert
const testArray = ['a','b','c']
const testString = 'a,b,c'

describe('String#split', () => {
  
  it('should return an array', () => {
    assert(Array.isArray('a,b,c'.split(',')))
  })

  it('should return the same array', () => {
    assert.equal(testArray.length, 
      testString.split(',').length, 
      `arrays have equal length`)
    for (let i = 0; i < testArray.length; i++) {
      assert.equal(testArray[i], 
        testString.split(',')[i], 
        `i element is equal`)
    }
  })

})