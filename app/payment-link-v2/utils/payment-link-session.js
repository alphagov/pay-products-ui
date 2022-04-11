'use strict'

const lodash = require('lodash')
const { getSessionCookieName } = require('../../utils/cookie')

const REFERENCE_KEY = 'reference'
const AMOUNT_KEY = 'amount'
const REFERENCE_PROVIDED_BY_QUERY_PARAMS_KEY = 'referenceProvidedByQueryParams'
const AMOUNT_PROVIDED_BY_QUERY_PARAMS_KEY = 'amountProvidedByQueryParams'

function cookieIndex(key, productExternalId) {
  return `${getSessionCookieName()}.${productExternalId}.${key}`
}

function getReference(req, productExternalId) {
  return lodash.get(req, cookieIndex(REFERENCE_KEY, productExternalId))
}

function setReference(req, productExternalId, reference, providedByQueryParams = false) {
  lodash.set(req, cookieIndex(REFERENCE_KEY, productExternalId), reference)
  if (providedByQueryParams) {
    lodash.set(req, cookieIndex(REFERENCE_PROVIDED_BY_QUERY_PARAMS_KEY, productExternalId), true)
  }
}

function getAmount(req, productExternalId) {
  return lodash.get(req, cookieIndex(AMOUNT_KEY, productExternalId))
}

function setAmount(req, productExternalId, amount, providedByQueryParams = false) {
  lodash.set(req, cookieIndex(AMOUNT_KEY, productExternalId), amount)
  if (providedByQueryParams) {
    lodash.set(req, cookieIndex(AMOUNT_PROVIDED_BY_QUERY_PARAMS_KEY, productExternalId), true)
  }
}

function getReferenceProvidedByQueryParams(req, productExternalId) {
  return lodash.get(req, cookieIndex(REFERENCE_PROVIDED_BY_QUERY_PARAMS_KEY, productExternalId), false)
}

function getAmountProvidedByQueryParams(req, productExternalId) {
  return lodash.get(req, cookieIndex(AMOUNT_PROVIDED_BY_QUERY_PARAMS_KEY, productExternalId), false)
}

function deletePaymentLinkSession(req, productExternalId) {
  lodash.unset(req, `${getSessionCookieName()}.${productExternalId}`)
}

module.exports = {
  getReference,
  setReference,
  getAmount,
  setAmount,
  getReferenceProvidedByQueryParams,
  getAmountProvidedByQueryParams,
  deletePaymentLinkSession
}
