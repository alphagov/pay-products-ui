'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../utils/response')
const errorResponse = response.renderErrorView

const makePayment = require('./make_payment_controller')
const paths = require('../paths.js')

module.exports = (req, res) => {
  const product = req.product
  logger.info(`[${req.correlationId}] routing product of type: ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
    case ('PROTOTYPE'):
      makePayment(req, res)
      break
    case ('ADHOC'):
      res.redirect(303, paths.adhocPayment.howToPay.replace(/:productExternalId/, product.externalId))
      break
    default:
      logger.error(`[${req.correlationId}] error routing product of type: ${product.type}`)
      errorResponse(req, res, 'We are unable to process your request at this time', 500)
  }
}
