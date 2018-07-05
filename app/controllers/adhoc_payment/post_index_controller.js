'use strict'

// Custom dependencies
const {isCurrency, isAboveMaxAmount} = require('../../browsered/field-validation-checks')

const makePayment = require('../make_payment_controller')
const index = require('./get_index_controller')
const productReferenceCtrl = require('../product_reference')
const {getSessionVariable} = require('../../utils/cookie')

const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports = (req, res) => {
  const product = req.product

  if (product.reference_enabled) {
    const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')
    if (sessionReferenceNumber) {
      req.referenceNumber = sessionReferenceNumber
    } else {
      productReferenceCtrl.index(req, res)
    }
  }

  if (product.price) {
    req.paymentAmount = product.price
    return makePayment(req, res)
  }

  let paymentAmount = req.body['payment-amount']
  if (!paymentAmount || isCurrency(paymentAmount)) {
    req.errorMessage = `<h2 class="govuk-heading-m govuk-!-margin-bottom-0">${isCurrency(paymentAmount)}</h2>`
    return index(req, res)
  } else if (isAboveMaxAmount(paymentAmount)) {
    req.errorMessage = `<h2 class="govuk-heading-m govuk-!-margin-bottom-0">${isAboveMaxAmount(paymentAmount)}</h2>`
    return index(req, res)
  } else {
    paymentAmount = paymentAmount.replace(/[^0-9.-]+/g, '')
    const currencyMatch = AMOUNT_FORMAT.exec(paymentAmount)
    if (!currencyMatch[2]) {
      paymentAmount = paymentAmount + '.00'
    }
    req.paymentAmount = Math.trunc(paymentAmount * 100)
    makePayment(req, res)
  }
}
