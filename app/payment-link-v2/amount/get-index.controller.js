'use strict'

// Node.js core dependencies
const currencyFormatter = require('currency-formatter')

// Custom dependencies
const logger = require('../../utils/logger')(__filename)
const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { NotFoundError } = require('../../errors')

function asGBP (amountInPence) {
  return currencyFormatter.format((amountInPence / 100).toFixed(2), { code: 'GBP' })
}

module.exports = (req, res, next) => {
  const product = req.product
  const correlationId = req.correlationId
  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    productDescription: product.description,
    productReferenceEnabled: product.reference_enabled,
    captchaChallengeFailed: req.captchaChallengeFailed
  }

  if (product.price) {
    return next(new NotFoundError('Attempted to access amount page with a product that already has a price.'))
  }

  const sessionAmount = getSessionVariable(req, 'amount')

  if (sessionAmount) {
    data.backLinkHref = formatAccountPathsFor(paths.paymentLinksV2.confirm, product.externalId)
    data.productAmount = sessionAmount
    return response(req, res, 'amount/amount', data)
  }

  if (product.reference_enabled) {
    const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')
    if (!sessionReferenceNumber) {
      data.backLinkHref = formatAccountPathsFor(paths.paymentLinksV2.reference, product.externalId)
      return response(req, res, 'amount/amount', data)
    }
  }

  if (!product.reference_enabled) {
    data.backLinkHref = formatAccountPathsFor(paths.paymentLinksV2.product, product.externalId)
    return response(req, res, 'amount/amount', data)
  }

  return next(new Error('Attempted to access amount page in an invalid state.'))
}
