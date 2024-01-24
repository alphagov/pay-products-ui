'use strict'

const logger = require('../utils/logger')(__filename)
const { response, renderErrorView } = require('../utils/response')
const makePayment = require('./make-payment.controller')
const replaceParamsInPath = require('../utils/replace-params-in-path')
const { paymentLinks } = require('../paths')
const paymentLinkSession = require('../payment-links/utils/payment-link-session')
const { validateReference } = require('../utils/validation/form-validations')
const { isAboveMaxAmountInPence } = require('../utils/validation/amount-validations')
const { InvalidPrefilledAmountError, InvalidPrefilledReferenceError } = require('../errors')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

function getContinueUrlForNewPaymentLinkJourney (product, referenceProvidedByQueryParams, amountProvidedByQueryParams) {
  if (product.reference_enabled && !referenceProvidedByQueryParams) {
    return replaceParamsInPath(paymentLinks.reference, product.externalId)
  }
  if (!product.price && !amountProvidedByQueryParams) {
    return replaceParamsInPath(paymentLinks.amount, product.externalId)
  }
  return replaceParamsInPath(paymentLinks.confirm, product.externalId)
}

function isPositiveNumber (value) {
  return value.match(/^\d+$/)
}

module.exports = (req, res, next) => {
  const product = req.product
  const { reference, amount } = req.query || {}

  logger.info(`Routing product of type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
    case ('PROTOTYPE'):
      return makePayment(req, res)
    case ('ADHOC'):
    case ('AGENT_INITIATED_MOTO'): {
      if (reference || amount) {
        paymentLinkSession.deletePaymentLinkSession(req, product.externalId)
      }
      if (product.reference_enabled && reference) {
        if (!validateReference(reference).valid) {
          return next(new InvalidPrefilledReferenceError(`Invalid reference: ${reference}`))
        }
        paymentLinkSession.setReference(req, product.externalId, reference, true)
      }
      if (!product.price && amount) {
        if (!isPositiveNumber(amount) || isAboveMaxAmountInPence(parseInt(amount)) || (parseInt(amount) === 0)) {
          return next(new InvalidPrefilledAmountError(`Invalid amount: ${amount}`))
        }
        paymentLinkSession.setAmount(req, product.externalId, amount, true)
      }
      const referenceProvidedByQueryParams = paymentLinkSession.getReferenceProvidedByQueryParams(req, product.externalId)
      const amountProvidedByQueryParams = paymentLinkSession.getAmountProvidedByQueryParams(req, product.externalId)
      const continueUrl = getContinueUrlForNewPaymentLinkJourney(product, referenceProvidedByQueryParams, amountProvidedByQueryParams)
      return response(req, res, 'start/start', {
        continueUrl
      })
    }
    default:
      logger.error(`Error routing product of type ${product.type}`)
      return renderErrorView(req, res, errorMessagePath, 500)
  }
}
