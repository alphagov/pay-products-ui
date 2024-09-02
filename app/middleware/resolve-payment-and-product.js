'use strict'

// Custom dependencies
const { renderErrorView } = require('../utils/response')
const productsClient = require('../clients/products/products.client')
const adminusersClient = require('../clients/adminusers/adminusers.client')
const { addField } = require('../clients/base/request-context')
const { GATEWAY_ACCOUNT_ID, SERVICE_EXTERNAL_ID, PAYMENT_EXTERNAL_ID, PRODUCT_EXTERNAL_ID } = require('@govuk-pay/pay-js-commons').logging.keys

module.exports = function (req, res, next) {
  const { paymentExternalId } = req.params
  const correlationId = req.correlationId
  productsClient.payment.getByPaymentExternalId(paymentExternalId)
    .then(payment => {
      addField(PAYMENT_EXTERNAL_ID, payment.externalId)
      req.payment = res.locals.payment = payment
      return productsClient.product.getByProductExternalId(payment.productExternalId)
    })
    .then(product => {
      req.product = res.locals.product = product
      addField(PRODUCT_EXTERNAL_ID, product.externalId)
      return product
    })
    .then(product => {
      addField(GATEWAY_ACCOUNT_ID, product.gatewayAccountId)
      return adminusersClient.getServiceByGatewayAccountId(product.gatewayAccountId, correlationId)
    })
    .then(service => {
      addField(SERVICE_EXTERNAL_ID, service.externalId)
      req.service = service
      res.locals.service = service
      next()
    })
    .catch(err => {
      renderErrorView(req, res, 'error.internal', err.errorCode || 500)
    })
}
