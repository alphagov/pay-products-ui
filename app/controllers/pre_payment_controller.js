'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView

const makePayment = require('./make_payment_controller')
const adhocPaymentCtrl = require('./adhoc_payment')

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
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
      return adhocPaymentCtrl.index(req, res)
  }

  logger.error(`[${correlationId}] error routing product of type ${product.type}`)
  return errorResponse(req, res, messages.internalError, 500)
}
