'use strict'

const productFixtures = require('../../fixtures/product.fixtures')
const { stubBuilder } = require('./stub-builder')

function getProductByExternalIdStub (opts) {
  const path = `/v1/api/products/${opts.external_id}`
  return stubBuilder('GET', path, 200, {
    response: productFixtures.validProductResponse(opts)
  })
}

function getProductByPathStub (opts) {
  const path = '/v1/api/products'
  return stubBuilder('GET', path, 200, {
    query: {
      serviceNamePath: opts.service_name_path,
      productNamePath: opts.product_name_path
    },
    response: productFixtures.validProductResponse(opts)
  })
}

module.exports = {
  getProductByExternalIdStub,
  getProductByPathStub
}
