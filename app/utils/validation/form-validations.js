'use strict'

// Constants
const MAX_AMOUNT = 100000

const validationMessageKeys = {
  enterAnAmountInPounds: 'paymentLinksV2.fieldValidation.enterAnAmountInPounds',
  enterAnAmountInTheCorrectFormat: 'paymentLinksV2.fieldValidation.enterAnAmountInTheCorrectFormat',
  enterAnAmountUnderMaxAmount: 'paymentLinksV2.fieldValidation.enterAnAmountUnderMaxAmount'
}

exports.validationErrors = validationMessageKeys

const validReturnObject = {
  valid: true,
  messageKey: null
}

function notValidReturnObject (messageKey) {
  return {
    valid: false,
    messageKey
  }
}

function isEmpty (value) {
  if (value === '') {
    return validationMessageKeys.enterAnAmountInPounds
  } else {
    return false
  }
}

function isNotCurrency (value) {
  if (!/^([0-9]+)(?:\.([0-9]{1,2}))?$/.test(value)) {
    return validationMessageKeys.enterAnAmountInTheCorrectFormat
  } else {
    return false
  }
}

function isAboveMaxAmount (value) {
  if (!isNotCurrency(value) && parseFloat(value) > MAX_AMOUNT) {
    return validationMessageKeys.enterAnAmountUnderMaxAmount
  }
  return false
}

function validateAmount (amount) {
  const isEmptyErrorMessageKey = isEmpty(amount)
  if (isEmptyErrorMessageKey) {
    return notValidReturnObject(isEmptyErrorMessageKey)
  }

  const isNotCurrencyErrorMessageKey = isNotCurrency(amount)
  if (isNotCurrencyErrorMessageKey) {
    return notValidReturnObject(isNotCurrencyErrorMessageKey)
  }

  const isAboveMaxAmountErrorMessageKey = isAboveMaxAmount(amount)
  if (isAboveMaxAmountErrorMessageKey) {
    return notValidReturnObject(isAboveMaxAmountErrorMessageKey)
  }

  return validReturnObject
}

module.exports = {
  validateAmount
}
