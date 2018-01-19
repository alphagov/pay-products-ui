'use strict'

// Custom dependencies
const {isCurrency, isAboveMaxAmount} = require('../../browsered/field-validation-checks')

const makePayment = require('../make_payment_controller')
const getAmount = require('./get_amount_controller')

const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports = (req, res) => {
  let paymentAmount = req.body['payment-amount']

  if (!paymentAmount || isCurrency(paymentAmount)) {
    req.flash('genericError', `<h2>Use valid characters only</h2> ${isCurrency(paymentAmount)}`)
    getAmount(req, res)
  } else if (isAboveMaxAmount(paymentAmount)) {
    req.flash('genericError', `<h2>Enter a valid amount</h2> ${isAboveMaxAmount(paymentAmount)}`)
    getAmount(req, res)
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
