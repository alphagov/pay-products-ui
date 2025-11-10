const { expect } = require('chai')

const { isAboveMaxAmountInPounds, isAboveMaxAmountInPence } = require('./amount-validations')

describe('Amount validations', () => {
  describe('Check if amount in pence is above max amount', () => {
    it('should return true when amount is above maximum', () => {
      expect(isAboveMaxAmountInPence(10000001)).to.equal(true)
    })
    it('should return false when amount is equal maximum', () => {
      expect(isAboveMaxAmountInPence(10000000)).to.equal(false)
    })
    it('should return false when amount is below maximum', () => {
      expect(isAboveMaxAmountInPence(9999999)).to.equal(false)
    })
  })
  describe('Check if amount in pounds is above max amount', () => {
    it('should return true when amount is above maximum', () => {
      expect(isAboveMaxAmountInPounds(100000.01)).to.equal(true)
    })
    it('should return false when amount is equal maximum', () => {
      expect(isAboveMaxAmountInPounds(100000.00)).to.equal(false)
    })
    it('should return false when amount is below maximum', () => {
      expect(isAboveMaxAmountInPounds(99999.99)).to.equal(false)
    })
  })
})
