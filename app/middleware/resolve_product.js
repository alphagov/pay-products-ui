'use strict'

// Custom dependencies
const {renderErrorView} = require('../utils/response')
const productsClient = require('../services/clients/products_client')

module.exports = function (req, res, next) {
  const {productExternalId} = req.params
  productsClient.product.getByProductExternalId(productExternalId)
    .then(product => {
      req.product = product
      res.locals.product = product
      next()
    })
    .catch(err => {
      renderErrorView(req, res, 'Sorry, we are unable to process your request', err.errorCode || 500)
    })
}
