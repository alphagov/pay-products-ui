'use strict'

const getProductsClient = require('./clients/products_client')

// Exports
module.exports = {
  getProduct,
  createCharge
}

/**
 *
 * @param {String} externalProductId
 * @param correlationId
 *
 * @returns Promise<Product>
 */
function getProduct (externalProductId, correlationId) {
  return getProductsClient({correlationId})
    .getProduct(externalProductId)
}

/**
 * @param {Product} productExternalId
 * @param {long} priceOverride - override price in pence
 * @param correlationId
 * @return {Promise.<Charge>}
 */
function createCharge (productExternalId, priceOverride = undefined, correlationId) {
  return getProductsClient({correlationId})
    .createCharge(productExternalId, priceOverride)
}
