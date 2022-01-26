'use strict'

const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const { NotFoundError } = require('../../errors')
const getBackLinkUrl = require('./get-back-link-url')

module.exports = function getReferencePage (req, res, next) {
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
