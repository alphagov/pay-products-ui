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

function getContinueUrlForNewPaymentLinkJourney (product, validReferenceProvided, validAmountProvided) {
  if (product.reference_enabled && !validReferenceProvided) {
    return replaceParamsInPath(paymentLinksV2.reference, product.externalId)
  }
  if (!product.price && !validAmountProvided) {
    return replaceParamsInPath(paymentLinksV2.amount, product.externalId)
  }
  return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
}

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const { reference, amount} = req.query || {}

  logger.info(`[${correlationId}] routing product of type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
    case ('PROTOTYPE'):
      return makePayment(req, res)
    case ('ADHOC'):
    case ('AGENT_INITIATED_MOTO'):
      if (product.newPaymentLinkJourneyEnabled) {
        if (reference || amount) {
          paymentLinkSession.deletePaymentLinkSession(req, product.externalId)
        }
        let validReferenceProvided, validAmountProvided
        if (product.reference_enabled && reference && validateReference(reference).valid) {
          paymentLinkSession.setReference(req, product.externalId, reference)
          validReferenceProvided = true
        }
        if (!product.price && amount && validateAmount(amount).valid) {
          paymentLinkSession.setAmount(req, product.externalId, amount)
          validAmountProvided = true
        }
        const continueUrl = getContinueUrlForNewPaymentLinkJourney(product, validReferenceProvided, validAmountProvided)
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
