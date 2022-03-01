'use strict'

const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const { NotFoundError } = require('../../errors')
const { paymentLinksV2 } = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')

function getPage (req, res, next) {
  const product = req.product

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    paymentReferenceLabel: product.reference_label,
    paymentReferenceHint: product.reference_hint
  }

  if (!product.reference_enabled) {
    return next(new NotFoundError('Attempted to access reference confirm page with a product that auto-generates references.'))
  }

  const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')

  data.backLinkHref = replaceParamsInPath(paymentLinksV2.reference, product.externalId)

  if (sessionReferenceNumber) {
    data.reference = sessionReferenceNumber
  }

  return response(req, res, 'reference-confirm/reference-confirm', data)
}

module.exports = {
  getPage
}
