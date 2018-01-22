'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../../utils/response').response

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const data = {
    serviceName: product.serviceName,
    productExternalId: product.externalId
  }

  logger.info(`[${correlationId}] getting amount for product payment ${product.externalId}`)
  response(req, res, 'adhoc-payment/amount', data)
}
