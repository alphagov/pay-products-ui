'use strict'

const index = require('./get_product_reference_controller')
const client = require('../../services/clients/products_client')
const adhocPaymentCtrl = require('../adhoc_payment')
const {renderErrorView} = require('../../utils/response')
const {setSessionVariable} = require('../../utils/cookie')

module.exports = (req, res) => {
  const product = req.product
  if (product.referenceNumber) {
    req.referenceNumber = product.referenceNumber
    return adhocPaymentCtrl.index(req, res)
  }

  const referenceNumber = req.body['payment-reference']
  if (!referenceNumber) {
    req.errorMessage = `<h2>Enter a ${product.reference_label}</h2>`
    return index(req, res)
  } else if (referenceNumber.trim().length > 255) {
    req.errorMessage = `<h2>The ${product.reference_label} is not valid</h2>`
    return index(req, res)
  } else {
    client.payment.getByGatewayAccountIdAndReference(req.product.gatewayAccountId, referenceNumber)
      .then(payment => {
        req.errorMessage = `<h2>The ${product.reference_label} is not valid</h2>`
        return index(req, res)
      })
      .catch(err => {
        if (err.errorCode === 404) {
          setSessionVariable(req, 'referenceNumber', referenceNumber)
          return adhocPaymentCtrl.index(req, res)
        } else {
          renderErrorView(req, res, 'Sorry, we are unable to process your request', err.errorCode || 500)
        }
      })
  }
}
