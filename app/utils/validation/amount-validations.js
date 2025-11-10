'use strict'

const MAX_AMOUNT_IN_POUNDS = 100000

function isAboveMaxAmountInPounds (value) {
  return value > MAX_AMOUNT_IN_POUNDS
}

function isAboveMaxAmountInPence (value) {
  return value > MAX_AMOUNT_IN_POUNDS * 100
}

module.exports = {
  isAboveMaxAmountInPounds,
  isAboveMaxAmountInPence
}
