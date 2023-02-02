'use strict'
// NPM dependencies
const lodash = require('lodash')

// Custom dependencies
const logger = require('../utils/logger')(__filename)
const response = require('../utils/response')
const { renderErrorView } = response

// Local dependencies
const { demoPayment, pay } = require('../paths')
const paymentStatus = require('./payment-status.controller')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

module.exports = (req, res) => {
  const payment = req.payment
  const product = req.product
  logger.info(`Routing payment complete based on product type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
      res.redirect(lodash.get(payment, 'govukStatus', '').toLowerCase() === 'success' ? demoPayment.success.replace(':productExternalId', product.externalId) : demoPayment.failure.replace(':productExternalId', product.externalId))
      break
    case ('PROTOTYPE'):
      res.redirect(product.returnUrl)
      break
    case ('ADHOC'):
    case ('AGENT_INITIATED_MOTO'):
      lodash.get(payment, 'govukStatus', '').toLowerCase() === 'success' ? paymentStatus(req, res) : res.redirect(pay.product.replace(':productExternalId', product.externalId))
      break
    default:
      logger.error(`Error routing payment complete based on product type ${product.type}`)
      return renderErrorView(req, res, errorMessagePath, 500)
  }
}
