'use strict'

const { CORRELATION_ID } = require('@govuk-pay/pay-js-commons').logging.keys

const { AsyncLocalStorage } = require('async_hooks')
const crypto = require('crypto')

const asyncLocalStorage = new AsyncLocalStorage()

function requestContextMiddleware (req, res, next) {
  asyncLocalStorage.run({}, () => {
    const correlationId = req.headers[CORRELATION_ID] || crypto.randomBytes(16).toString('hex')

    asyncLocalStorage.getStore()[CORRELATION_ID] =  correlationId
    
    next()
  })
}

function addField (key, value) {
  if (asyncLocalStorage.getStore()) {
    asyncLocalStorage.getStore()[key] = value
  }
}

function getRequestCorrelationIDField () {
  if (asyncLocalStorage.getStore()) {
    return asyncLocalStorage.getStore()[CORRELATION_ID]
  }
}

function getLoggingFields () {
  return asyncLocalStorage.getStore()
}

module.exports = {
  requestContextMiddleware,
  addField,
  getRequestCorrelationIDField,
  getLoggingFields
}
