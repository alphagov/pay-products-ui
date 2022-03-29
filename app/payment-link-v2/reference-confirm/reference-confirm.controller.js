'use strict'

const { response } = require('../../utils/response')
const { NotFoundError } = require('../../errors')
const { paymentLinksV2 } = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const paymentLinkSession = require('../utils/payment-link-session')

function getPage (req, res, next) {
  const product = req.product

  if (!product.reference_enabled) {
    return next(new NotFoundError('Attempted to access reference confirm page with a product that auto-generates references.'))
  }

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    productDescription: product.description,
    paymentReferenceLabel: product.reference_label,
    paymentReferenceHint: product.reference_hint
  }

  data.referencePageUrl = replaceParamsInPath(paymentLinksV2.reference, product.externalId)

  const confirmAndContinueUrlPath = product.price ? paymentLinksV2.confirm : paymentLinksV2.amount
  data.confirmAndContinuePageUrl = replaceParamsInPath(confirmAndContinueUrlPath, product.externalId)

  const sessionReferenceNumber = paymentLinkSession.getReference(req, product.externalId)

  if (sessionReferenceNumber) {
    data.reference = sessionReferenceNumber
  }

  return response(req, res, 'reference-confirm/reference-confirm', data)
}

module.exports = {
  getPage
}
