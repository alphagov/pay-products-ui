'use strict'

// NPM dependencies
const i18n = require('i18n')

// Custom dependencies
const { isCurrency, isAboveMaxAmount } = require('../../browsered/field-validation-checks')

const makePayment = require('../make_payment_controller')
const index = require('./get_index_controller')
const productReferenceCtrl = require('../product_reference')
const { getSessionVariable } = require('../../utils/cookie')
const i18nConfig = require('../../../config/i18n')

const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

i18n.configure(i18nConfig)

module.exports = (req, res) => {
  i18n.setLocale(req.product.language || 'en')
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
  if (!paymentAmount || isCurrency(paymentAmount, i18n.__('fieldValidation.currency'))) {
    req.errorMessage = `<h2 class="govuk-heading-m govuk-!-margin-bottom-0">${isCurrency(paymentAmount, i18n.__('fieldValidation.currency'))}</h2>`
    return index(req, res)
  } else if (isAboveMaxAmount(paymentAmount, i18n.__('fieldValidation.isAboveMaxAmount'))) {
    req.errorMessage = `<h2 class="govuk-heading-m govuk-!-margin-bottom-0">${isAboveMaxAmount(paymentAmount, i18n.__('fieldValidation.isAboveMaxAmount'))}</h2>`
    return index(req, res)
  } else {
    paymentAmount = paymentAmount.replace(/[^0-9.]+/g, '')
    const currencyMatch = AMOUNT_FORMAT.exec(paymentAmount)
    if (!currencyMatch[2]) {
      paymentAmount = paymentAmount + '.00'
    }
    req.paymentAmount = Number(paymentAmount.replace('.', ''))
    makePayment(req, res)
  }
}
