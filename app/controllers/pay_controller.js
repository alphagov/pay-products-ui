'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView
const productService = require('../services/product_service')

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
}

module.exports = {

  /**
   *
   * @param req
   * @param res
   */
  makePayment: (req, res) => {
    const product = req.product
    const correlationId = req.correlationId
    if (product) {
      logger.info(`[${correlationId}] creating charge for product ${product.name}`)
      productService.createCharge(product.externalProductId, correlationId)
        .then(charge => {
          logger.info(`[${correlationId}] initiating payment for charge ${charge.externalChargeId}`)
          return res.redirect(303, charge.nextLink)
        })
        .catch(err => {
          logger.error(`[${correlationId}] error creating charge for product ${product.externalProductId}. err = ${err}`)
          return errorResponse(req, res, messages.internalError, 500)
        })
    } else {
      logger.error(`[${correlationId}] product not found to make payment`)
      return errorResponse(req, res, messages.internalError, 500)
    }
  }
}
