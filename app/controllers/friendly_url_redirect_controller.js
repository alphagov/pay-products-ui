'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const productsClient = require('../services/clients/products_client')
const response = require('../utils/response')
const errorResponse = response.renderErrorView

// Constants
const messages = {
  internalError: 'We are unable to process your request at this time'
}

module.exports = (req, res) => {
  const {serviceNamePath, productNamePath} = req.params
  productsClient.product.getByProductPath(serviceNamePath, productNamePath)
    .then(product => {
      logger.info(`Redirecting to ${product.links.pay.href}`)
      return res.redirect(product.links.pay.href)
    })
    .catch(err => {
      return errorResponse(req, res, messages.internalError, err.errorCode || 500)
    })
}
