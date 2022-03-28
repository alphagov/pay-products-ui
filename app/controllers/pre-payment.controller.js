'use strict'

const logger = require('../utils/logger')(__filename)
const { response, renderErrorView } = require('../utils/response')
const makePayment = require('./make-payment.controller')
const adhocPaymentCtrl = require('./adhoc-payment')
const productReferenceCtrl = require('./product-reference')
const replaceParamsInPath = require('../utils/replace-params-in-path')
const { paymentLinksV2 } = require('../paths')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

function getContinueUrlForNewPaymentLinkJourney(product) {
  if (product.reference_enabled) {
    return replaceParamsInPath(paymentLinksV2.reference, product.externalId)
  }
  if (!product.price) {
    return replaceParamsInPath(paymentLinksV2.amount, product.externalId)
  }
  return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
}


module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId

  logger.info(`[${correlationId}] routing product of type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
    case ('PROTOTYPE'):
      return makePayment(req, res)
    case ('ADHOC'):
    case ('AGENT_INITIATED_MOTO'):
      if (product.newPaymentLinkJourneyEnabled) {
        const continueUrl = getContinueUrlForNewPaymentLinkJourney(product)
        return response(req, res, 'start/start', {
          continueUrl
        })
      }
      else if (product.reference_enabled) {
        return productReferenceCtrl.index(req, res)
      } else {
        return adhocPaymentCtrl.index(req, res)
      }
    default:
      logger.error(`[${correlationId}] error routing product of type ${product.type}`)
      return renderErrorView(req, res, errorMessagePath, 500)
  }
}
