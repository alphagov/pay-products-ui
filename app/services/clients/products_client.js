'use strict'

// Local Dependencies
const Product = require('../../models/Product.class')
const Charge = require('../../models/Charge.class')
const baseClient = require('./base_client/base_client')
const {PRODUCTS_URL, PRODUCTS_API_TOKEN} = require('../../../config')

// Constants
const SERVICE_NAME = 'products'

// Use baseurl to create a baseclient for the product microservice
const baseUrl = `${PRODUCTS_URL}/v1/api`
const headers = {
  Authorization: `Bearer ${PRODUCTS_API_TOKEN}`
}

// Exports
module.exports = {
  createProduct,
  getProduct,
  createCharge
}

/**
 * @param {String} externalProductId: external product id
 * @returns {Promise<Product>}
 */
function getProduct (externalProductId) {
  return baseClient.get({
    headers,
    baseUrl,
    url: `/products/${externalProductId}`,
    description: 'find a product',
    service: SERVICE_NAME
  }).then(product => new Product(product))
}

/**
 * @param {String} productExternalId
 * @param {long} priceOverride. (Optional) if a different price need to be charged to the one that is defined in product.
 * @returns Promise<Charge>
 */
function createCharge (productExternalId, priceOverride) {
  return baseClient.post({
    headers,
    baseUrl,
    url: `/charges`,
    json: true,
    body: {
      external_product_id: productExternalId,
      amount: priceOverride
    },
    description: 'create a charge for a product',
    service: SERVICE_NAME
  }).then(charge => new Charge(charge))
}

/**
 * @param {Object} productData
 * @param {string} productData.external_service_id - The external service id of this gatewayAccountId
 * @param {string} productData.name - The name of the product
 * @param {long} productData.price - The price of product in pence
 * @param {string} productData.description - (Optional) The description of the product
 * @param {string} productData.return_url - (Optional) Where to redirect to upon completion of a charge for this product
 * @returns {Promise<Product>}
 */
function createProduct (productData) {
  return baseClient.post({
    headers,
    baseUrl,
    url: `/products`,
    json: true,
    body: {
      external_service_id: productData.external_service_id,
      pay_api_token: productData.pay_api_token,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      return_url: productData.return_url
    },
    description: 'create a product for a service',
    service: SERVICE_NAME
  }).then(product => new Product(product))
}
