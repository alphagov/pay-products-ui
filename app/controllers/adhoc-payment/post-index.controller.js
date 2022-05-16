'use strict'

const { isCurrency, isAboveMaxAmount } = require('../../browsered/field-validation-checks')

const makePayment = require('../make-payment.controller')
const index = require('./get-index.controller')
const productReferenceCtrl = require('../product-reference')
const { getSessionVariable, setSessionVariable } = require('../../utils/cookie')
const captcha = require('../../utils/captcha')
const logger = require('../../utils/logger')(__filename)

const GOOGLE_RECAPTCHA_FORM_NAME = 'g-recaptcha-response'
const AMOUNT_FORMAT = /^([0-9]+)(?:\.([0-9]{2}))?$/

module.exports = async (req, res) => {
  const product = req.product

  if (product.reference_enabled) {
    const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')
    if (sessionReferenceNumber) {
      req.referenceNumber = sessionReferenceNumber
      setSessionVariable(req, 'referenceNumber', '')
    } else {
      return productReferenceCtrl.index(req, res)
    }
  }

  if (product.requireCaptcha) {
    const token = req.body[GOOGLE_RECAPTCHA_FORM_NAME]
    try {
      const challengeIsValid = await captcha.verifyCAPTCHAToken(token)
      if (challengeIsValid) {
        logger.info('User passed CAPTCHA challenge')
      } else {
        logger.warn('User failed CAPTCHA challenge')
        req.captchaChallengeFailed = true
        return index(req, res)
      }
    } catch (error) {
      logger.error('CAPTCHA challenge failed to respond correctly', error)
      req.captchaChallengeFailed = true
      return index(req, res)
    }
  }

  if (product.price) {
    req.paymentAmount = product.price
    return makePayment(req, res)
  }

  let paymentAmount = req.body['payment-amount']
  const currencyError = isCurrency(paymentAmount, res.locals.__p('fieldValidation.currency'))
  if (currencyError) {
    req.errorMessage = `<h2 class="govuk-heading-m govuk-!-margin-bottom-0">${currencyError}</h2>`
    return index(req, res)
  }
  const maxAmountError = isAboveMaxAmount(paymentAmount, res.locals.__p('fieldValidation.isAboveMaxAmount'))
  if (maxAmountError) {
    req.errorMessage = `<h2 class="govuk-heading-m govuk-!-margin-bottom-0">${maxAmountError}</h2>`
    return index(req, res)
  }

  paymentAmount = paymentAmount.replace(/[^0-9.]+/g, '')
  const currencyMatch = AMOUNT_FORMAT.exec(paymentAmount)
  if (!currencyMatch[2]) {
    paymentAmount = paymentAmount + '.00'
  }
  req.paymentAmount = Number(paymentAmount.replace('.', ''))
  makePayment(req, res)
}
