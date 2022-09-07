'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const { isAboveMaxAmount, isAPotentialPAN } = require('./field-validation-checks')
const i18n = require('../../locales/en.json')

describe('field validation checks', () => {
  describe('isAboveMaxAmount', () => {
    it('should return an error string if it is passed an currency string exceeding £100 thousand', () => {
      expect(isAboveMaxAmount('10000000.01', i18n.fieldValidation.isAboveMaxAmount)).to.equal('Choose an amount under £100,000')
    })

    it('should not return false if it is not passed an currency string', () => {
      expect(isAboveMaxAmount('100,000 pounds sterling', i18n.fieldValidation.isAboveMaxAmount)).to.equal(false)
    })
  })
  describe('Potential card number', () => {
    it('should return true if reference passes luhn check', () => {
      expect(isAPotentialPAN('4242424242424242')).to.equal(true)
    })
    it('should return true if reference has characters [- or space] and passes luhn check', () => {
      expect(isAPotentialPAN('4242 4242 4242-42-42')).to.equal(true)
    })
    it('should return false if reference is less than 12 digits', () => {
      expect(isAPotentialPAN('42424242424')).to.equal(false)
    })
    it('should return false if reference has more than 19 digits', () => {
      expect(isAPotentialPAN('4242 4242 4242 4242 4242 4242')).to.equal(false)
    })
    it('should return false if reference fails luhn check', () => {
      expect(isAPotentialPAN('42424242424211')).to.equal(false)
    })
    it('should return false if reference has characters [- or space] and but fails luhn check', () => {
      expect(isAPotentialPAN('4242-4242-4242-11')).to.equal(false)
    })
    it('should return false for reference with characters', () => {
      expect(isAPotentialPAN('REF123456')).to.equal(false)
    })
  })
})
