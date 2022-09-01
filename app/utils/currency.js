'use strict'

/**
 * Converts a pounds and pence amount, such as
 * '131.20', to a pence amount, such as 13120,
 * while avoiding the perils of IEEE floating-
 * point arithmetic.
 * 
 * Acceptable input strings either have two
 * decimal places, such as '131.20', or are whole
 * pound amounts, such as '131'.
 * 
 * Examples:
 * 
 * 131.20 → 13120
 * 
 * 131 → 131
 *
 * @param {string} poundsAndPenceAmount
 * @returns {number}
 */
function convertPoundsAndPenceToPence (poundsAndPenceAmount) {
  if (!poundsAndPenceAmount.includes('.')) {
    poundsAndPenceAmount = poundsAndPenceAmount + '.00'
  }

  return Number(poundsAndPenceAmount.replace('.', ''))
}

/**
 * Converts a pence amount, such as '510', to a
 * pounds and pence amount, such as '5.10'.
 * 
 * This will work fine for all numbers that have
 * up to 15 significant digits, which is a
 * ludicrous amount of money (hundreds of
 * trillions of pounds).
 * 
 * Examples:
 * 
 * 510 → 5.10
 * 
 * 10 → 0.10
 * 
 * 1 → 0.01
 *
 * @param {string} penceAmount
 * @returns {string}
 */
function convertPenceToPoundsAndPence (penceAmount) {
  return (parseFloat(penceAmount / 100)).toFixed(2)
}

module.exports = {
  convertPoundsAndPenceToPence,
  convertPenceToPoundsAndPence
}
