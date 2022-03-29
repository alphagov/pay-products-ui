'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const { response } = require('../../utils/response')
const { NotFoundError } = require('../../errors')
const getBackLinkUrl = require('./get-back-link-url')
const { validateReference } = require('../../utils/validation/form-validations')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const isAPotentialPan = require('./is-a-potential-pan')
const paymentLinkSession = require('../utils/payment-link-session')

const PAYMENT_REFERENCE = 'payment-reference'

function capitaliseFirstLetter (errorMessage) {
  return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1)
}

function validateReferenceFormValue (reference, referenceLabel, res) {
  const errors = {}
  const referenceValidationResult = validateReference(reference)
  if (!referenceValidationResult.valid) {
    const errorMessage = res.locals.__p(referenceValidationResult.messageKey).replace('%s', referenceLabel)
    errors[PAYMENT_REFERENCE] = capitaliseFirstLetter(errorMessage)
  }

  return errors
}

function getNextPageUrl (productPrice, sessionAmount, reference) {
  if (isAPotentialPan(reference)) {
    return paths.paymentLinksV2.referenceConfirm
  } else if (productPrice || sessionAmount) {
    return paths.paymentLinksV2.confirm
  } else {
    return paths.paymentLinksV2.amount
  }
}

function getPage (req, res, next) {
  const product = req.product

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    paymentReferenceLabel: product.reference_label,
    paymentReferenceHint: product.reference_hint
  }

  if (!product.reference_enabled) {
    return next(new NotFoundError('Attempted to access reference page with a product that auto-generates references.'))
  }

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)

  data.backLinkHref = getBackLinkUrl(sessionReferenceNumber, product)

  if (sessionReferenceNumber) {
    data.reference = sessionReferenceNumber
  }

  return response(req, res, 'reference/reference', data)
}

function postPage (req, res, next) {
  const paymentReference = lodash.get(req.body, PAYMENT_REFERENCE, '')
  const product = req.product

  const errors = validateReferenceFormValue(paymentReference, product.reference_label, res)

  const sessionRefererence = paymentLinkSession.getReference(req, product.externalId)
  const sessionAmount = paymentLinkSession.getAmount(req, product.externalId)

  const backLinkHref = getBackLinkUrl(sessionRefererence, product)

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    backLinkHref: backLinkHref
  }

  if (!lodash.isEmpty(errors)) {
    data.errors = errors
    data.reference = paymentReference

    return response(req, res, 'reference/reference', data)
  }

  paymentLinkSession.setReference(req, product.externalId, paymentReference)

  return res.redirect(replaceParamsInPath(getNextPageUrl(product.price, sessionAmount, paymentReference), product.externalId))
}

module.exports = {
  getPage,
  postPage
}
