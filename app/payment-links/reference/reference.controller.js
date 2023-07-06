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

function getNextPageUrl (productPrice, isEditing, reference, amountProvidedByQueryParams) {
  if (isAPotentialPan(reference)) {
    return paths.paymentLinks.referenceConfirm + (isEditing ? '?change=true' : '')
  } else if (productPrice || isEditing || amountProvidedByQueryParams) {
    return paths.paymentLinks.confirm
  } else {
    return paths.paymentLinks.amount
  }
}

function getPage (req, res, next) {
  const product = req.product
  const { change } = req.query || {}

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

  if (paymentLinkSession.getError(req, product.externalId)) {
    const errors = {}
    const errorMessage = res.locals.__p(paymentLinkSession.getError(req, product.externalId))
    errors[PAYMENT_REFERENCE] = capitaliseFirstLetter(errorMessage)
    paymentLinkSession.setError(req, product.externalId, '')
    data.errors = errors
  }

  data.backLinkHref = getBackLinkUrl(change, product)

  if (sessionReferenceNumber) {
    data.reference = sessionReferenceNumber
  }

  return response(req, res, 'reference/reference', data)
}

function postPage (req, res, next) {
  const paymentReference = lodash.get(req.body, PAYMENT_REFERENCE, '')
  const product = req.product
  const { change } = req.query || {}

  const errors = validateReferenceFormValue(paymentReference, product.reference_label, res)

  const backLinkHref = getBackLinkUrl(change, product)

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
  const amountProvidedByQueryParams = paymentLinkSession.getAmountProvidedByQueryParams(req, product.externalId)

  const redirectUrl = getNextPageUrl(product.price, change, paymentReference, amountProvidedByQueryParams)
  return res.redirect(replaceParamsInPath(redirectUrl, product.externalId))
}

module.exports = {
  getPage,
  postPage
}
