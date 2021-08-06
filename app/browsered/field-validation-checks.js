'use strict'

const Luhn = require('luhn-js')

// Constants
const MAX_AMOUNT = 100000

exports.isEmpty = (value, message) => {
  if (value === '') {
    return message
  } else {
    return false
  }
}

exports.isCurrency = (value, message) => {
  if (!/^([0-9]+)(?:\.([0-9]{2}))?$/.test(value)) {
    return message
  } else {
    return false
  }
}

exports.isAboveMaxAmount = (value, message) => {
  if (!exports.isCurrency(value, message) && parseFloat(value) > MAX_AMOUNT) {
    return message.replace('%s', MAX_AMOUNT.toLocaleString())
  }
  return false
}

exports.isNaxsiSafe = (value, message) => {
  if (/[<>;:`()"'=|,~[\]]+/g.test(value)) {
    return message
  } else {
    return false
  }
}

exports.isAPotentialPAN = (value) => {
  const referenceWithoutSpaceAndHyphen = value.replace(/[\s-]/g, '')

  const NUMBERS_ONLY = /^\d+$/
  if (NUMBERS_ONLY.test(referenceWithoutSpaceAndHyphen) &&
      referenceWithoutSpaceAndHyphen.length >= 12 && referenceWithoutSpaceAndHyphen.length <= 19) {
    return Luhn.isValid(referenceWithoutSpaceAndHyphen)
  }

  return false
}
