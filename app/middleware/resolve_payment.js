'use strict'

// Custom dependencies
const {renderErrorView} = require('../utils/response')
const productsClient = require('../services/clients/products_client')

module.exports = function (req, res, next) {
  const {paymentExternalId} = req.params
  productsClient.payment.getByPaymentExternalId(paymentExternalId)
    .then(payment => {
      productsClient.product.getByProductExternalId(payment.productExternalId)
        .then(product => {
          req.payment = payment
          req.product = product
          res.locals.payment = payment
          res.locals.product = product
          next()
        })
        .catch(err => {
          renderErrorView(req, res, 'Sorry, we are unable to process your request', err.errorCode || 500)
        })
    })
    .catch(err => {
      renderErrorView(req, res, 'Sorry, we are unable to process your request', err.errorCode || 500)
    })
}
