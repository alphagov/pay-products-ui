'use strict'

const lodash = require('lodash')
const { getSessionCookieName } = require('../../utils/cookie')

function getReference (req, productExternalId) {
  const sessionName = getSessionCookieName()
  return lodash.get(req, `${sessionName}.${productExternalId}.reference`)
}

function setReference (req, productExternalId, reference) {
  const sessionName = getSessionCookieName()
  lodash.set(req, `${sessionName}.${productExternalId}.reference`, reference)
}

function getAmount (req, productExternalId) {
  const sessionName = getSessionCookieName()
  return lodash.get(req, `${sessionName}.${productExternalId}.amount`)
}

function setAmount (req, productExternalId, amount) {
  const sessionName = getSessionCookieName()
  lodash.set(req, `${sessionName}.${productExternalId}.amount`, amount)
}

function deletePaymentLinkSession (req, productExternalId) {
  const sessionName = getSessionCookieName()
  lodash.unset(req, `${sessionName}.${productExternalId}`)
}

module.exports = {
  getReference,
  setReference,
  getAmount,
  setAmount,
  deletePaymentLinkSession
}
