'use strict'

// NPM dependencies
const {expect} = require('chai')

// Local dependencies
const {isAboveMaxAmount} = require('../../../app/browsered/field-validation-checks')

describe('field validation checks', () => {
  describe('isAboveMaxAmount', () => {
    it('should return an error string if it is passed an currency string exceeding £10 million', () => {
      expect(isAboveMaxAmount('10000000.01')).to.equal(`Choose an amount under £10,000,000`)
    })

    it('should not return false if it is not passed an currency string', () => {
      expect(isAboveMaxAmount('10,000,000 pounds sterling')).to.equal(false)
    })
  })
})
