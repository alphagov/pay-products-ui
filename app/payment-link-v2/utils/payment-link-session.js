'use strict'

const lodash = require('lodash')
const { getSessionCookieName } = require('../../utils/cookie')

const REFERENCE_KEY = 'reference'
const AMOUNT_KEY = 'amount'

function cookieIndex (key, productExternalId) {
  return `${getSessionCookieName()}.${productExternalId}.${key}`
}

function getReference (req, productExternalId) {
  return lodash.get(req, cookieIndex(REFERENCE_KEY, productExternalId))
}

function setReference (req, productExternalId, reference) {
  lodash.set(req, cookieIndex(REFERENCE_KEY, productExternalId), reference)
}

function getAmount (req, productExternalId) {
  return lodash.get(req, cookieIndex(AMOUNT_KEY, productExternalId))
}

function setAmount (req, productExternalId, amount) {
  lodash.set(req, cookieIndex(AMOUNT_KEY, productExternalId), amount)
}

function deletePaymentLinkSession (req, productExternalId) {
  lodash.unset(req, `${getSessionCookieName()}.${productExternalId}`)
}

module.exports = {
  getReference,
  setReference,
  getAmount,
  setAmount,
  deletePaymentLinkSession
}
