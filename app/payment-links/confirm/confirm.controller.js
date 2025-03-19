'use strict'
const lodash = require('lodash')

const { response } = require('../../utils/response')
const paths = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const captcha = require('../../utils/captcha')
const logger = require('../../utils/logger')(__filename)
const productsClient = require('../../clients/products/products.client')
const paymentLinkSession = require('../utils/payment-link-session')
const { convertPenceToPoundsAndPence } = require('../../utils/currency')
const { AccountCannotTakePaymentsError } = require('../../errors')

const HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE = 'reference-value'
const HIDDEN_FORM_FIELD_ID_AMOUNT = 'amount'
const GOOGLE_RECAPTCHA_FORM_NAME = 'g-recaptcha-response'
const ERROR_KEY_RECAPTCHA = 'recaptcha'

function getBackLinkUrl (product, referenceProvidedByQueryParams, amountProvidedByQueryParams) {
  if (!product.price && !amountProvidedByQueryParams) {
    return replaceParamsInPath(paths.paymentLinks.amount, product.externalId)
  } else if (product.reference_enabled && !referenceProvidedByQueryParams) {
    return replaceParamsInPath(paths.paymentLinks.reference, product.externalId)
  } else {
    return replaceParamsInPath(paths.pay.product, product.externalId)
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
      errors[ERROR_KEY_RECAPTCHA] = translationMethod('paymentLinks.fieldValidation.youMustSelectIAmNotARobot')
    }
  } catch (error) {
    logger.error('CAPTCHA challenge failed to respond correctly', error)
    errors[ERROR_KEY_RECAPTCHA] = translationMethod('paymentLinks.fieldValidation.youMustSelectIAmNotARobot')
  }

  return errors
}

function setupPageData (product, sessionReferenceNumber, sessionAmount, referenceProvidedByQueryParams, amountProvidedByQueryParams) {
  const amountAsPence = product.price || sessionAmount
  const amountTo2DecimalPoint = convertPenceToPoundsAndPence(amountAsPence)
  const amountAsGbp = Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amountTo2DecimalPoint)
  const canChangeAmount = !product.price && !amountProvidedByQueryParams
  const canChangeReference = product.reference_enabled && !referenceProvidedByQueryParams
  const backLinkHref = getBackLinkUrl(product, referenceProvidedByQueryParams, amountProvidedByQueryParams)

  return {
    productExternalId: product.externalId,
    productName: product.name,
    productReferenceLabel: product.reference_label,
    sessionAmount,
    amountAsPence,
    amountAsGbp,
    sessionReferenceNumber,
    canChangeAmount,
    canChangeReference,
    requireCaptcha: product.requireCaptcha,
    backLinkHref
  }
}

function getPage (req, res, next) {
  const product = req.product

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)
  const sessionAmount = paymentLinkSession.getAmount(req, product.externalId)
  const referenceProvidedByQueryParams = paymentLinkSession.getReferenceProvidedByQueryParams(req, product.externalId)
  const amountProvidedByQueryParams = paymentLinkSession.getAmountProvidedByQueryParams(req, product.externalId)

  if (!sessionAmount && !product.price) {
    logger.info('Attempted to access confirm page without a price in the session or product. ' +
    'Redirecting to start page')
    return res.redirect(replaceParamsInPath(paths.pay.product, product.externalId))
  } else if (product.reference_enabled && !sessionReferenceNumber) {
    logger.info('Attempted to access confirm page without a reference in the session ' +
    'for a product that requires a reference.  Redirecting to start page')
    return res.redirect(replaceParamsInPath(paths.pay.product, product.externalId))
  }

  const data = setupPageData(product, sessionReferenceNumber, sessionAmount, referenceProvidedByQueryParams, amountProvidedByQueryParams)

  return response(req, res, 'confirm/confirm', data)
}

async function postPage (req, res, next) {
  const product = req.product

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)
  const sessionAmount = paymentLinkSession.getAmount(req, product.externalId)
  const referenceProvidedByQueryParams = paymentLinkSession.getReferenceProvidedByQueryParams(req, product.externalId)
  const amountProvidedByQueryParams = paymentLinkSession.getAmountProvidedByQueryParams(req, product.externalId)

  if (product.requireCaptcha) {
    const errors = await validateRecaptcha(
      req.body[GOOGLE_RECAPTCHA_FORM_NAME],
      res.locals.__p
    )

    if (!lodash.isEmpty(errors)) {
      const data = setupPageData(product, sessionReferenceNumber, sessionAmount, referenceProvidedByQueryParams, amountProvidedByQueryParams)

      data.errors = errors

      return response(req, res, 'confirm/confirm', data)
    }
  }

  try {
    logger.info('Creating charge for product')

    const amountToUseForPayment = parseInt(product.price || req.body[HIDDEN_FORM_FIELD_ID_AMOUNT])
    const referenceToUseForPayment = product.reference_enabled ? req.body[HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE] : null

    const payment = await productsClient.payment.create(
      product.externalId,
      amountToUseForPayment,
      referenceToUseForPayment
    )

    res.redirect(303, payment.links.next.href)
  } catch (error) {
    if (error.errorIdentifier && error.errorIdentifier === 'AMOUNT_BELOW_MINIMUM') {
      paymentLinkSession.setError(req, product.externalId, res.locals.__p('paymentLinks.fieldValidation.amountBelowMinimum'))
      return res.redirect(replaceParamsInPath(paths.paymentLinks.amount, product.externalId))
    }

    if (error.errorIdentifier && error.errorIdentifier === 'CARD_NUMBER_IN_PAYMENT_LINK_REFERENCE_REJECTED') {
      paymentLinkSession.setError(req, product.externalId, 'fieldValidation.potentialPANInReference')
      return res.redirect(replaceParamsInPath(paths.paymentLinks.reference, product.externalId))
    }

    if (error.errorCode === 403) {
      return next(new AccountCannotTakePaymentsError('Forbidden response returned by Public API when creating payment'))
    }
    return next(error)
  }
}

module.exports = {
  getPage,
  postPage
}
