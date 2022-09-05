'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response')
const { NotFoundError } = require('../../errors')
const paths = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const paymentLinkSession = require('../utils/payment-link-session')

const CONFIRM_REFERENCE = 'confirm-reference'

function getNextPageUrl (productPrice, isEditing, confirmReference, amountProvidedByQueryParams) {
  if (confirmReference === 'no') {
    return paths.paymentLinks.reference
  } else if (productPrice || isEditing || amountProvidedByQueryParams) {
    return paths.paymentLinks.confirm
  } else {
    return paths.paymentLinks.amount
  }
}

function validateConfirmReferenceFormValue (confirmReference, referenceLabel, res) {
  const errors = {}

  if (!confirmReference) {
    errors[CONFIRM_REFERENCE] = res.locals.__p('paymentLinks.referenceConfirm.selectYesIfYourReferenceIsCorrect').replace('%s', referenceLabel)
  }

  return errors
}

function getPage (req, res, next) {
  const product = req.product

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)

  if (!product.reference_enabled) {
    return next(new NotFoundError('Attempted to access reference confirm page with a product that auto-generates references.'))
  } else if (!sessionReferenceNumber) {
    return next(new NotFoundError('Attempted to access reference confirm page without a reference in the session.'))
  }

  const heading = res.locals.__p('paymentLinks.referenceConfirm.confirmYourReference').replace('%s', product.reference_label)

  const data = {
    heading,
    productExternalId: product.externalId,
    productName: product.name,
    productDescription: product.description,
    paymentReferenceLabel: product.reference_label,
    paymentReferenceHint: product.reference_hint,
    reference: sessionReferenceNumber
  }

  const backLinkHref = replaceParamsInPath(paths.paymentLinks.reference, product.externalId)
  data.backLinkHref = backLinkHref

  return response(req, res, 'reference-confirm/reference-confirm', data)
}

function postPage (req, res, next) {
  const confirmReference = lodash.get(req.body, CONFIRM_REFERENCE, '')
  const product = req.product
  const { change } = req.query || {}

  const errors = validateConfirmReferenceFormValue(confirmReference, product.reference_label, res)

  const backLinkHref = replaceParamsInPath(paths.paymentLinks.reference, product.externalId)

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    backLinkHref: backLinkHref
  }

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)

  if (sessionReferenceNumber) {
    data.reference = sessionReferenceNumber
  }

  if (!lodash.isEmpty(errors)) {
    data.errors = errors

    return response(req, res, 'reference-confirm/reference-confirm', data)
  }

  const amountProvidedByQueryParams = paymentLinkSession.getAmountProvidedByQueryParams(req, product.externalId)

  const redirectUrl = getNextPageUrl(product.price, change, confirmReference, amountProvidedByQueryParams)
  return res.redirect(replaceParamsInPath(redirectUrl, product.externalId))
}

module.exports = {
  getPage,
  postPage
}
