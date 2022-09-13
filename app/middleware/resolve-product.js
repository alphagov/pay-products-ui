'use strict'

// Custom dependencies
const { renderErrorView } = require('../utils/response')
const productsClient = require('../services/clients/products/products.client')
const adminusersClient = require('../services/clients/adminusers/adminusers.client')
const { GATEWAY_ACCOUNT_ID, SERVICE_EXTERNAL_ID, PRODUCT_EXTERNAL_ID } = require('@govuk-pay/pay-js-commons').logging.keys
const { addLoggingField } = require('../utils/log-context')

module.exports = function (req, res, next) {
  const { productExternalId } = req.params
  productsClient.product.getByProductExternalId(productExternalId)
    .then(product => {
      addLoggingField(PRODUCT_EXTERNAL_ID, product.externalId)
      req.product = product
      res.locals.product = product
      return product
    })
    .then(product => {
      addLoggingField(GATEWAY_ACCOUNT_ID, product.gatewayAccountId)
      return adminusersClient.getServiceByGatewayAccountId(product.gatewayAccountId, req.correlationId)
    })
    .then(service => {
      addLoggingField(SERVICE_EXTERNAL_ID, service.externalId)
      req.service = service
      res.locals.service = service
      next()
    })
    .catch(err => {
      renderErrorView(req, res, 'error.internal', err.errorCode || 500)
    })
}
