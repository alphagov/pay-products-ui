'use strict'

const { expect } = require('chai')

const { convertPoundsAndPenceToPence, convertPenceToPoundsAndPence } = require('../../../app/utils/currency')

describe('Currency utilities', () => {

  describe('when converting pounds and pence to pence', () => {

    it('should convert 131.20 to 13120', () => {
      var expected = 13120
      var actual = convertPoundsAndPenceToPence('131.20')
      expect(actual).to.equal(expected)
    })

    it('should convert 131 to 13100', () => {
      var expected = 13100
      var actual = convertPoundsAndPenceToPence('131')
      expect(actual).to.equal(expected)
    })

    it('should convert 0.10 to 10', () => {
      var expected = 10
      var actual = convertPoundsAndPenceToPence('0.10')
      expect(actual).to.equal(expected)
    })

    it('should convert 0.01 to 1', () => {
      var expected = 1
      var actual = convertPoundsAndPenceToPence('0.01')
      expect(actual).to.equal(expected)
    })

    it('should convert 0.7 to 70', () => {
      var expected = 70
      var actual = convertPoundsAndPenceToPence('0.7')
      expect(actual).to.equal(expected)
    })

    it('should convert 131.2 to 13120', () => {
      var expected = 13120
      var actual = convertPoundsAndPenceToPence('131.2')
      expect(actual).to.equal(expected)
    })

  })

  describe('when converting pence to pounds and pence', () => {

    it('should convert 510 to 5.10', () => {
      var expected = '5.10'
      var actual = convertPenceToPoundsAndPence(510)
      expect(actual).to.equal(expected)
    })

    it('should convert 10 to 0.10', () => {
      var expected = '0.10'
      var actual = convertPenceToPoundsAndPence(10)
      expect(actual).to.equal(expected)
    })

    it('should convert 1 to 0.01', () => {
      var expected = '0.01'
      var actual = convertPenceToPoundsAndPence(1)
      expect(actual).to.equal(expected)
    })

  })

})
