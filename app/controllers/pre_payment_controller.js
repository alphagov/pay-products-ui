'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView

const makePayment = require('./make_payment_controller')
const adhocPaymentCtrl = require('./adhoc_payment')
const productReferenceCtrl = require('./product_reference')

// Constants
const messages = {
  internalError: 'Sorry, we are unable to process your request'
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
      if (product.reference_enabled) {
        return productReferenceCtrl.index(req, res)
      } else {
        return adhocPaymentCtrl.index(req, res)
      }
    default:
      logger.error(`[${correlationId}] error routing product of type ${product.type}`)
      return errorResponse(req, res, messages.internalError, 500)
  }
}
