'use strict'

// Constants
const MAX_AMOUNT = 100000
const MAX_REFERENCE_LENGTH = 255

const validationMessageKeys = {
  enterAnAmountInPounds: 'paymentLinks.fieldValidation.enterAnAmountInPounds',
  enterAnAmountInTheCorrectFormat: 'paymentLinks.fieldValidation.enterAnAmountInTheCorrectFormat',
  enterAnAmountUnderMaxAmount: 'paymentLinks.fieldValidation.enterAnAmountUnderMaxAmount',
  enterAReference: 'paymentLinks.fieldValidation.enterAReference',
  referenceMustBeLessThanOrEqual50Chars: 'paymentLinks.fieldValidation.referenceMustBeLessThanOrEqual50Chars',
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

function isEmptyReference (value) {
  if (value === '') {
    return validationMessageKeys.enterAReference
  } else {
    return false
  }
}

function isReferenceTooLong (value) {
  if (value.trim().length > MAX_REFERENCE_LENGTH) {
    return validationMessageKeys.referenceMustBeLessThanOrEqual50Chars
  } else {
    return false
  }
}

function isReferenceNaxsiSafe (value) {
  if (/[<>;:`()"'=|,~[\]]+/g.test(value)) {
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
