'use strict'

const logger = require('../utils/logger')(__filename)
const { response, renderErrorView } = require('../utils/response')
const makePayment = require('./make-payment.controller')
const adhocPaymentCtrl = require('./adhoc-payment')
const productReferenceCtrl = require('./product-reference')
const replaceParamsInPath = require('../utils/replace-params-in-path')
const { paymentLinksV2 } = require('../paths')
const paymentLinkSession = require('../payment-link-v2/utils/payment-link-session')
const { validateReference, validateAmount } = require('../utils/validation/form-validations')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

function getContinueUrlForNewPaymentLinkJourney (product, referenceProvidedByQueryParams, amountProvidedByQueryParams) {
  if (product.reference_enabled && !referenceProvidedByQueryParams) {
    return replaceParamsInPath(paymentLinksV2.reference, product.externalId)
  }
  if (!product.price && !amountProvidedByQueryParams) {
    return replaceParamsInPath(paymentLinksV2.amount, product.externalId)
  }
  return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
}

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const { reference, amount } = req.query || {}

  logger.info(`[${correlationId}] routing product of type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
    case ('PROTOTYPE'):
      return makePayment(req, res)
    case ('ADHOC'):
    case ('AGENT_INITIATED_MOTO'):
      if (product.newPaymentLinkJourneyEnabled || process.env.NEW_PAYMENT_LINK_JOURNEY_ENABLED_FOR_ALL_PAYMENT_LINKS === 'true') {
        if (reference || amount) {
          paymentLinkSession.deletePaymentLinkSession(req, product.externalId)
        }
        if (product.reference_enabled && reference && validateReference(reference).valid) {
          paymentLinkSession.setReference(req, product.externalId, reference, true)
        }
        if (!product.price && amount && validateAmount(amount).valid) {
          paymentLinkSession.setAmount(req, product.externalId, amount, true)
        }
        const referenceProvidedByQueryParams = paymentLinkSession.getReferenceProvidedByQueryParams(req, product.externalId)
        const amountProvidedByQueryParams = paymentLinkSession.getAmountProvidedByQueryParams(req, product.externalId)
        const continueUrl = getContinueUrlForNewPaymentLinkJourney(product, referenceProvidedByQueryParams, amountProvidedByQueryParams)
        return response(req, res, 'start/start', {
          continueUrl
        })
      } else if (product.reference_enabled) {
        return productReferenceCtrl.index(req, res)
      } else {
        return adhocPaymentCtrl.index(req, res)
      }
    default:
      logger.error(`[${correlationId}] error routing product of type ${product.type}`)
      return renderErrorView(req, res, errorMessagePath, 500)
  }
}
