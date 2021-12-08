'use strict'

const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const { NotFoundError } = require('../../errors')
const getBackLinkUrl = require('./get-back-link-url')

module.exports = (req, res, next) => {
  const product = req.product

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  if (product.price) {
    return next(new NotFoundError('Attempted to access amount page with a product that already has a price.'))
  }

  const sessionAmount = getSessionVariable(req, 'amount')

  data.backLinkHref = getBackLinkUrl(sessionAmount, product)

  if (sessionAmount) {
    data.productAmount = (sessionAmount / 100).toFixed(2)
  }

  return response(req, res, 'amount/amount', data)
}
