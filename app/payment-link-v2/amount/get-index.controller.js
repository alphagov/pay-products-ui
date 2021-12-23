'use strict'

const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const paths = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { NotFoundError } = require('../../errors')

module.exports = (req, res, next) => {
  const product = req.product
  const data = {
    productExternalId: product.external_id,
    productName: product.name
  }

  if (product.price) {
    return next(new NotFoundError('Attempted to access amount page with a product that already has a price.'))
  }

  const sessionAmount = getSessionVariable(req, 'amount')

  if (sessionAmount) {
    data.backLinkHref = replaceParamsInPath(paths.paymentLinksV2.confirm, product.external_id)
    data.productAmount = (sessionAmount / 100).toFixed(2)
  } else if (product.reference_enabled) {
    data.backLinkHref = replaceParamsInPath(paths.paymentLinksV2.reference, product.external_id)
  } else {
    data.backLinkHref = replaceParamsInPath(paths.paymentLinksV2.product, product.external_id)
  }
  return response(req, res, 'amount/amount', data)
}
