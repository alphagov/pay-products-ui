'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView
const productsClient = require('../services/clients/products_client')

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
}

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  if (product) {
    logger.info(`[${correlationId}] creating charge for product ${product.name}`)
    return productsClient.createCharge(product.externalProductId)
      .then(charge => {
        logger.info(`[${correlationId}] initiating payment for charge ${charge.externalChargeId}`)
        return res.redirect(303, charge.nextLink.href)
      })
      .catch(err => {
        logger.error(`[${correlationId}] error creating charge for product ${product.externalProductId}. err = ${err}`)
        return errorResponse(req, res, messages.internalError, err.errorCode || 500)
      })
  } else {
    logger.error(`[${correlationId}] product not found to make payment`)
    return errorResponse(req, res, messages.internalError, 500)
  }
}
