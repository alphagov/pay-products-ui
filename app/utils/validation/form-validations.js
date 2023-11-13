'use strict'

const validations = require('@govuk-pay/pay-js-commons').utils.fieldValidationChecks
const { isAboveMaxAmountInPounds } = require('./amount-validations')

// Constants
const MAX_REFERENCE_LENGTH = 255

const validationMessageKeys = {
  enterAnAmountInPounds: 'paymentLinks.fieldValidation.enterAnAmountInPounds',
  enterANonZeroAmountInPounds: 'paymentLinks.fieldValidation.enterANonZeroAmountInPounds',
  enterAnAmountInTheCorrectFormat: 'paymentLinks.fieldValidation.enterAnAmountInTheCorrectFormat',
  enterAnAmountUnderMaxAmount: 'paymentLinks.fieldValidation.enterAnAmountUnderMaxAmount',
  enterAReference: 'paymentLinks.fieldValidation.enterAReference',
  referenceTooLong: 'paymentLinks.fieldValidation.referenceTooLong',
  referenceCantUseInvalidChars: 'paymentLinks.fieldValidation.referenceCantUseInvalidChars'
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

function isEmptyAmount (value) {
  if (validations.isEmpty(value)) {
    return validationMessageKeys.enterAnAmountInPounds
  } else {
    return false
  }
}

function isZeroAmount (value) {
  if (!isNotCurrency(value) && (['0', '0.0', '0.00'].indexOf(value.trim()) > -1)) {
    return validationMessageKeys.enterANonZeroAmountInPounds
  }
  return false
}

function isNotCurrency (value) {
  if (validations.isCurrency(value)) {
    return validationMessageKeys.enterAnAmountInTheCorrectFormat
  } else {
    return false
  }
}

function isAboveMaxAmount (value) {
  if (!isNotCurrency(value) && isAboveMaxAmountInPounds(parseFloat(value))) {
    return validationMessageKeys.enterAnAmountUnderMaxAmount
  }
  return false
}

function isEmptyReference (value) {
  if (validations.isEmpty(value)) {
    return validationMessageKeys.enterAReference
  } else {
    return false
  }
}

function isReferenceTooLong (value) {
  if (value.trim().length > MAX_REFERENCE_LENGTH) {
    return validationMessageKeys.referenceTooLong
  } else {
    return false
  }
}

function isReferenceNaxsiSafe (value) {
  if (validations.isNaxsiSafe(value)) {
    return validationMessageKeys.referenceCantUseInvalidChars
  } else {
    return false
  }
}

function validateAmount (amount) {
  const isEmptyAmountErrorMessageKey = isEmptyAmount(amount)
  if (isEmptyAmountErrorMessageKey) {
    return notValidReturnObject(isEmptyAmountErrorMessageKey)
  }

  const isNotCurrencyErrorMessageKey = isNotCurrency(amount)
  if (isNotCurrencyErrorMessageKey) {
    return notValidReturnObject(isNotCurrencyErrorMessageKey)
  }

  const isAboveMaxAmountErrorMessageKey = isAboveMaxAmount(amount)
  if (isAboveMaxAmountErrorMessageKey) {
    return notValidReturnObject(isAboveMaxAmountErrorMessageKey)
  }

  const isZeroAmountErrorMessageKey = isZeroAmount(amount)
  if (isZeroAmountErrorMessageKey) {
    return notValidReturnObject(isZeroAmountErrorMessageKey)
  }

  return validReturnObject
}

function validateReference (reference) {
  const isEmptyReferenceErrorMessageKey = isEmptyReference(reference)
  if (isEmptyReferenceErrorMessageKey) {
    return notValidReturnObject(isEmptyReferenceErrorMessageKey)
  }

  const isReferenceTooLongErrorMessageKey = isReferenceTooLong(reference)
  if (isReferenceTooLongErrorMessageKey) {
    return notValidReturnObject(isReferenceTooLongErrorMessageKey)
  }

  const isReferenceNaxsiSafeErrorMessageKey = isReferenceNaxsiSafe(reference)
  if (isReferenceNaxsiSafeErrorMessageKey) {
    return notValidReturnObject(isReferenceNaxsiSafeErrorMessageKey)
  }

  return validReturnObject
}

module.exports = {
  validateAmount,
  validateReference
}
