'use strict'

// Constants
const MAX_AMOUNT = 100000

const validationMessageKeys = {
  enterAnAmountInPounds: 'paymentLinksV2.fieldValidation.enterAnAmountInPounds',
  enterAnAmountInTheCorrectFormat: 'paymentLinksV2.fieldValidation.enterAnAmountInTheCorrectFormat',
  enterAnAmountUnderMaxAmount: 'paymentLinksV2.fieldValidation.enterAnAmountUnderMaxAmount',
  enterAReference: 'paymentLinksV2.fieldValidation.enterAReference',
  referenceMustBeLessThanOrEqual50Chars: 'paymentLinksV2.fieldValidation.referenceMustBeLessThanOrEqual50Chars',
  referenceCantUseInvalidChars: 'paymentLinksV2.fieldValidation.referenceCantUseInvalidChars'
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
  if (value.trim().length > 50) {
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
