'use strict'

const { response } = require('../../utils/response')

function getPage (req, res, next) {
  const product = req.product

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  return response(req, res, 'confirm/confirm', data)
}

module.exports = {
  getPage
}
