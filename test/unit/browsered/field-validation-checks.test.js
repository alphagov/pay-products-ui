'use strict'

// NPM dependencies
const { expect } = require('chai')

// Local dependencies
const { isAboveMaxAmount } = require('../../../app/browsered/field-validation-checks')
const i18n = require('../../../locales/en.json')

describe('field validation checks', () => {
  describe('isAboveMaxAmount', () => {
    it('should return an error string if it is passed an currency string exceeding £100 thousand', () => {
      expect(isAboveMaxAmount('10000000.01', i18n.fieldValidation.isAboveMaxAmount)).to.equal('Choose an amount under £100,000')
    })

    it('should not return false if it is not passed an currency string', () => {
      expect(isAboveMaxAmount('100,000 pounds sterling', i18n.fieldValidation.isAboveMaxAmount)).to.equal(false)
    })
  })
})
