'use strict'

const index = require('./get_product_reference_controller')
const client = require('../../services/clients/products_client')
const adhocPaymentCtrl = require('../adhoc_payment')
const {renderErrorView} = require('../../utils/response')

module.exports = (req, res) => {
  const product = req.product
  if (product.referenceNumber) {
    req.referenceNumber = product.referenceNumber
    return adhocPaymentCtrl.index(req, res)
  }

  const referenceNumber = req.body['payment-reference']
  if (!referenceNumber) {
    req.errorMessage = `<h2>This field cannot be blank</h2>`
    return index(req, res)
  } else {
    client.payment.getByGatewayAccountIdAndReference(req.product.gatewayAccountId, referenceNumber)
      .then(payment => {
        req.errorMessage = `<h2>This reference has been used before</h2>`
        return index(req, res)
      })
      .catch(err => {
        if (err.errorCode === 404) {
          req.referenceNumber = referenceNumber
          return adhocPaymentCtrl.index(req, res)
        } else {
          renderErrorView(req, res, 'Sorry, we are unable to process your request', err.errorCode || 500)
        }
      })
  }
}
