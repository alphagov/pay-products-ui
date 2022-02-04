'use strict'

const lodash = require('lodash')

const paths = require('../../paths')
const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const { NotFoundError } = require('../../errors')
const getBackLinkUrl = require('./get-back-link-url')
const { validateReference } = require('../../utils/validation/form-validations')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { setSessionVariable } = require('../../utils/cookie')
const isAPotentialPan = require('./is-a-potential-pan')

const PAYMENT_REFERENCE = 'payment-reference'

function validateReferenceFormValue (reference, res) {
  const errors = {}
  const referenceValidationResult = validateReference(reference)
  if (!referenceValidationResult.valid) {
    errors[PAYMENT_REFERENCE] = res.locals.__p(referenceValidationResult.messageKey)
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

  const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')

  data.backLinkHref = getBackLinkUrl(sessionReferenceNumber, product)

  if (sessionReferenceNumber) {
    data.referenceNumber = sessionReferenceNumber
  }

  return response(req, res, 'reference/reference', data)
}

function postPage (req, res, next) {
  const paymentReference = lodash.get(req.body, PAYMENT_REFERENCE, '')
  const errors = validateReferenceFormValue(paymentReference, res)

  const product = req.product

  const sessionRefererence = getSessionVariable(req, 'referenceNumber')
  const sessionAmount = getSessionVariable(req, 'amount')

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

  setSessionVariable(req, 'referenceNumber', paymentReference)

  return res.redirect(replaceParamsInPath(getNextPageUrl(product.price, sessionAmount, paymentReference), product.externalId))
}

module.exports = {
  getPage,
  postPage
}
