'use strict'

// Custom dependencies
const { renderErrorView } = require('../utils/response')
const productsClient = require('../services/clients/products.client')
const adminusersClient = require('../services/clients/adminusers.client')

module.exports = function (req, res, next) {
  const { productExternalId } = req.params
  productsClient.product.getByProductExternalId(productExternalId)
    .then(product => {
      req.product = product
      res.locals.product = product
      return product
    })
    .then(product => {
      return adminusersClient.getServiceByGatewayAccountId(product.gatewayAccountId, req.correlationId)
    })
    .then(service => {
      req.service = service
      res.locals.service = service
      next()
    })
    .catch(err => {
      renderErrorView(req, res, 'error.internal', err.errorCode || 500)
    })
}
