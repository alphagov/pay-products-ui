'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const productsClient = require('../services/clients/products_client')
const response = require('../utils/response')
const { renderErrorView } = response

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

module.exports = (req, res) => {
  const { serviceNamePath, productNamePath } = req.params
  productsClient.product.getByProductPath(serviceNamePath, productNamePath)
    .then(product => {
      logger.info(`Redirecting to ${product.links.pay.href}`)
      return res.redirect(product.links.pay.href)
    })
    .catch(err => {
      return renderErrorView(req, res, errorMessagePath, err.errorCode || 500)
    })
}
