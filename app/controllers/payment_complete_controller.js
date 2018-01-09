'use strict'
// NPM dependencies
const lodash = require('lodash')
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView

// Local dependencies
const {success, failure} = require('../paths').demoPayment

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
}

module.exports = (req, res) => {
  const payment = req.payment
  const product = req.product
  const correlationId = req.correlationId
  logger.info(`[${correlationId}] routing payment complete based on product type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
      res.redirect(lodash.get(payment, 'govukStatus', '').toLowerCase() === 'success' ? success : failure)
      break
    case ('PROTOTYPE'):
      res.redirect(product.returnUrl)
      break
    default:
      logger.error(`[${correlationId}] error routing payment complete based on product type ${product.type}`)
      return errorResponse(req, res, messages.internalError, 500)
  }
}
