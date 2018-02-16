'use strict'

// Node.js core dependencies
const logger = require('winston')
const currencyFormatter = require('currency-formatter')

// Custom dependencies
const response = require('../../utils/response').response

function asGBP (amountInPence) {
  return currencyFormatter.format((amountInPence / 100).toFixed(2), {code: 'GBP'})
}

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const data = {
    serviceName: product.serviceName,
    productExternalId: product.externalId
  }
  if (product.price) {
    data.price = asGBP(product.price)
  }
  if (req.errorMessage) {
    data.flash = {
      genericError: req.errorMessage
    }
  }

  logger.info(`[${correlationId}] getting amount for product payment ${product.externalId}`)
  response(req, res, 'adhoc-payment/amount', data)
}
