'use strict'

const productFixtures = require('../../fixtures/product.fixtures')
const { stubBuilder } = require('./stub-builder')

function getProductByExternalIdStub (opts) {
  const path = `/v1/api/products/${opts.external_id}`
  return stubBuilder('GET', path, 200, {
    response: productFixtures.validProductResponse(opts)
  })
}

module.exports = {
  getProductByExternalIdStub
}
