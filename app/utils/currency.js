'use strict'

/**
 * Converts a pounds and pence amount, such as
 * '131.20', to a pence amount, such as 13120,
 * while avoiding the perils of IEEE floating-
 * point arithmetic.
 *
 * Acceptable input strings are either whole
 * pound amounts, such as '131', amounts with two
 * decimal places, such as '131.20', or amounts
 * with one decimal place, such as '131.2' (which
 * is equivalent to '131.20').
 *
 * Examples:
 *
 * 131 → 131
 *
 * 131.20 → 13120
 *
 * 131.2 → 13120
 *
 * @param {string} poundsAndPenceAmount
 * @returns {number}
 */
function convertPoundsAndPenceToPence (poundsAndPenceAmount) {
  const indexOfLastCharacter = poundsAndPenceAmount.length - 1
  const indexOfDecimalPoint = poundsAndPenceAmount.lastIndexOf('.')
  const charactersAfterDecimalPoint = indexOfDecimalPoint !== -1 ? indexOfLastCharacter - indexOfDecimalPoint : 0

  let pounds
  let pence

  switch (charactersAfterDecimalPoint) {
    case 2:
      pounds = poundsAndPenceAmount.slice(0, indexOfDecimalPoint)
      pence = poundsAndPenceAmount.slice(indexOfDecimalPoint + 1)
      break
    case 1:
      pounds = poundsAndPenceAmount.slice(0, indexOfDecimalPoint)
      pence = poundsAndPenceAmount.slice(indexOfDecimalPoint + 1).concat('0')
      break
    default:
      pounds = poundsAndPenceAmount
      pence = '00'
  }

  return Number(pounds.concat(pence))
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
