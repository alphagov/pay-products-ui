'use strict'

const Luhn = require('luhn-js')

module.exports = function isAPotentialPAN (value) {
  const referenceWithoutSpaceAndHyphen = value.replace(/[\s-]/g, '')

  const NUMBERS_ONLY = /^\d+$/
  if (NUMBERS_ONLY.test(referenceWithoutSpaceAndHyphen) &&
      referenceWithoutSpaceAndHyphen.length >= 12 && referenceWithoutSpaceAndHyphen.length <= 19) {
    return Luhn.isValid(referenceWithoutSpaceAndHyphen)
  }

  return false
}
