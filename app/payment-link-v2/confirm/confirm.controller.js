'use strict'
const lodash = require('lodash')

const { response } = require('../../utils/response')
const { paymentLinksV2 } = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { NotFoundError } = require('../../errors')
const captcha = require('../../utils/captcha')
const logger = require('../../utils/logger')(__filename)
const productsClient = require('../../services/clients/products.client')
const paymentLinkSession = require('../utils/payment-link-session')

const HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE = 'reference-value'
const HIDDEN_FORM_FIELD_ID_AMOUNT = 'amount'
const GOOGLE_RECAPTCHA_FORM_NAME = 'g-recaptcha-response'
const ERROR_KEY_RECAPTCHA = 'recaptcha'

function generateSummaryElement (summaryLabel, summaryValue, changeUrl, hiddenFormFieldId, hiddenFormFieldValue) {
  return {
    summaryLabel,
    summaryValue,
    changeUrl,
    hiddenFormFieldId,
    hiddenFormFieldValue
  }
}

async function validateRecaptcha (
  googleRecaptchaFormValue,
  translationMethod
) {
  const errors = {}

  const token = googleRecaptchaFormValue
  try {
    const challengeIsValid = await captcha.verifyCAPTCHAToken(token)

    if (challengeIsValid) {
      logger.info('User passed CAPTCHA challenge')
    } else {
      logger.warn('User failed CAPTCHA challenge')
      errors[ERROR_KEY_RECAPTCHA] = translationMethod('paymentLinksV2.fieldValidation.youMustSelectIAmNotARobot')
    }
  } catch (error) {
    logger.error('CAPTCHA challenge failed to respond correctly', error)
    errors[ERROR_KEY_RECAPTCHA] = translationMethod('paymentLinksV2.fieldValidation.youMustSelectIAmNotARobot')
  }

  return errors
}

function getSummaryElements (
  referenceNumber,
  sessionAmount,
  productReferenceLabel,
  productExternalId,
  productPrice,
  translationMethod
) {
  const summaryElements = []

  if (referenceNumber) {
    summaryElements.push(generateSummaryElement(
      productReferenceLabel,
      referenceNumber,
      replaceParamsInPath(paymentLinksV2.reference, productExternalId),
      HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE,
      referenceNumber
    ))
  }

  const changeAmountUrl = replaceParamsInPath(paymentLinksV2.amount, productExternalId)
  const totalToPayText = translationMethod('paymentLinksV2.confirm.totalToPay')

  const amountToUse = productPrice || sessionAmount
  const amountAsGbp = getRightAmountToDisplayAsGbp(amountToUse)

  summaryElements.push(generateSummaryElement(
    totalToPayText,
    amountAsGbp,
    productPrice ? null : changeAmountUrl,
    HIDDEN_FORM_FIELD_ID_AMOUNT,
    amountToUse
  ))

  return summaryElements
}

function getRightAmountToDisplayAsGbp (amount) {
  const amountToDisplay = (parseFloat(amount) / 100).toFixed(2)

  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amountToDisplay)
}

function getPage (req, res, next) {
  const product = req.product

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)
  const sessionAmount = paymentLinkSession.getAmount(req, product.externalId)

  if (!sessionAmount && !product.price) {
    return next(new NotFoundError('Attempted to access confirm page without a price in the session or product.'))
  }

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  const summaryElements = getSummaryElements(
    sessionReferenceNumber,
    sessionAmount,
    product.reference_label,
    product.externalId,
    product.price,
    res.locals.__p
  )

  data.summaryElements = summaryElements
  data.confirmPageUrl = replaceParamsInPath(paymentLinksV2.confirm, product.externalId)

  return response(req, res, 'confirm/confirm', data)
}

async function postPage (req, res, next) {
  const product = req.product

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  const amountToUse = parseInt(product.price || req.body[HIDDEN_FORM_FIELD_ID_AMOUNT])
  const referenceValueToUse = product.reference_enabled ? req.body[HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE] : null

  if (product.requireCaptcha) {
    const errors = await validateRecaptcha(
      req.body[GOOGLE_RECAPTCHA_FORM_NAME],
      res.locals.__p
    )

    if (!lodash.isEmpty(errors)) {
      data.errors = errors

      const summaryElements = getSummaryElements(
        referenceValueToUse,
        req.body[HIDDEN_FORM_FIELD_ID_AMOUNT],
        product.reference_label,
        product.externalId,
        product.price,
        res.locals.__p
      )

      data.summaryElements = summaryElements

      return response(req, res, 'confirm/confirm', data)
    }
  }

  try {
    logger.info(`[${req.correlationId}] creating charge for product ${product.externalId}`)

    const payment = await productsClient.payment.create(
      product.externalId,
      amountToUse,
      referenceValueToUse
    )

    paymentLinkSession.deletePaymentLinkSession(req, product.externalId)
    res.redirect(303, payment.links.next.href)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  getPage,
  postPage
}
