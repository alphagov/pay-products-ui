'use strict'

const { expect } = require('chai')

const { convertPoundsAndPenceToPence, convertPenceToPoundsAndPence } = require('./currency')

describe('Currency utilities', () => {
  describe('when converting pounds and pence to pence', () => {
    it('should convert 131.20 to 13120', () => {
      const expected = 13120
      const actual = convertPoundsAndPenceToPence('131.20')
      expect(actual).to.equal(expected)
    })

    it('should convert 131 to 13100', () => {
      const expected = 13100
      const actual = convertPoundsAndPenceToPence('131')
      expect(actual).to.equal(expected)
    })

    it('should convert 0.10 to 10', () => {
      const expected = 10
      const actual = convertPoundsAndPenceToPence('0.10')
      expect(actual).to.equal(expected)
    })

    it('should convert 0.01 to 1', () => {
      const expected = 1
      const actual = convertPoundsAndPenceToPence('0.01')
      expect(actual).to.equal(expected)
    })

    it('should convert 0.7 to 70', () => {
      const expected = 70
      const actual = convertPoundsAndPenceToPence('0.7')
      expect(actual).to.equal(expected)
    })

    it('should convert 131.2 to 13120', () => {
      const expected = 13120
      const actual = convertPoundsAndPenceToPence('131.2')
      expect(actual).to.equal(expected)
    })
  })

  describe('when converting pence to pounds and pence', () => {
    it('should convert 510 to 5.10', () => {
      const expected = '5.10'
      const actual = convertPenceToPoundsAndPence(510)
      expect(actual).to.equal(expected)
    })

    it('should convert 10 to 0.10', () => {
      const expected = '0.10'
      const actual = convertPenceToPoundsAndPence(10)
      expect(actual).to.equal(expected)
    })

    it('should convert 1 to 0.01', () => {
      const expected = '0.01'
      const actual = convertPenceToPoundsAndPence(1)
      expect(actual).to.equal(expected)
    })
  })
})
