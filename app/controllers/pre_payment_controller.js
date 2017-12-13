'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView

const {PRODUCT_TYPE} = require('../models/product')
const makePayment = require('./make_payment_controller')
const paths = require('../paths.js')

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
}

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId

  logger.info(`[${correlationId}] routing product of type ${product.type}`)
  switch (product.type) {
    case (PRODUCT_TYPE.DEMO):
    case (PRODUCT_TYPE.PROTOTYPE):
      return makePayment(req, res)
    case (PRODUCT_TYPE.ADHOC):
      return res.redirect(303, paths.adhocPayment.howToPay.replace(/:productExternalId/, product.externalId))
  }

  logger.error(`[${correlationId}] error routing product of type ${product.type}`)
  return errorResponse(req, res, messages.internalError, 500)
}
