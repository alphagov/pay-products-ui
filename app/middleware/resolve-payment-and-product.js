'use strict'

// Custom dependencies
const { renderErrorView } = require('../utils/response')
const productsClient = require('../services/clients/products.client')
const adminusersClient = require('../services/clients/adminusers.client')

module.exports = function (req, res, next) {
  const { paymentExternalId } = req.params
  const correlationId = req.correlationId
  productsClient.payment.getByPaymentExternalId(paymentExternalId)
    .then(payment => {
      req.payment = res.locals.payment = payment
      return productsClient.product.getByProductExternalId(payment.productExternalId)
    })
    .then(product => {
      req.product = res.locals.product = product
      return product
    })
    .then(product => {
      return adminusersClient.getServiceByGatewayAccountId(product.gatewayAccountId, correlationId)
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
