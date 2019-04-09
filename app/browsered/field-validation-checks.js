'use strict'

// local dependencies
const emailValidator = require('../utils/email_tools.js')

// Constants
const NUMBERS_ONLY = new RegExp('^[0-9]+$')
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

exports.isValidEmail = (value, message) => {
  if (!emailValidator(value)) {
    return message
  } else {
    return false
  }
}

exports.isPhoneNumber = (value, message) => {
  const trimmedTelephoneNumber = value.replace(/\s/g, '')
  if (trimmedTelephoneNumber.length < 11 || !NUMBERS_ONLY.test(trimmedTelephoneNumber)) {
    return message
  } else {
    return false
  }
}

exports.isHttps = (value, message) => {
  if (value.substr(0, 8) !== 'https://') {
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
