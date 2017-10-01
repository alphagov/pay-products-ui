'use strict'

const q = require('q')
const requestLogger = require('../../utils/request_logger')
const baseClient = require('./base_client')
const Product = require('../../models/Product.class')
const Charge = require('../../models/Charge.class')
const createCallbackToPromiseConverter = require('../../utils/response_converter').createCallbackToPromiseConverter

const SERVICE_NAME = 'products'
const PRODUCTS_URL = process.env.PRODUCTS_URL
const PRODUCTS_API_KEY = process.env.PRODUCTS_API_KEY

const responseBodyToProductTransformer = body => new Product(body)
const responseBodyToChargeTransformer = body => new Charge(body)

module.exports = function (clientOptions = {}) {
  const baseUrl = clientOptions.baseUrl || PRODUCTS_URL
  const productsApiKey = clientOptions.productsApiKey || PRODUCTS_API_KEY
  const correlationId = clientOptions.correlationId || ''
  const productResource = `${baseUrl}/v1/api/products`
  const chargeResource = `${baseUrl}/v1/api/charges`

  /**
   * @param {String} externalProductId: external product id
   * @returns {Promise<Product>}
   */
  const getProduct = (externalProductId) => {
    const params = {
      correlationId: correlationId,
      headers: {
        Authorization: `Bearer ${productsApiKey}`
      }
    }
    const url = `${productResource}/${externalProductId}`
    const defer = q.defer()
    const startTime = new Date()
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'GET',
      description: 'find a product',
      service: SERVICE_NAME
    }

    const callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToProductTransformer)

    requestLogger.logRequestStart(context)

    baseClient.get(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter)

    return defer.promise
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
  const createProduct = (productData) => {
    const params = {
      correlationId: correlationId,
      payload: {
        external_service_id: productData.external_service_id,
        pay_api_token: productData.pay_api_token,
        name: productData.name,
        description: productData.description,
        price: productData.price
      },
      headers: {
        Authorization: `Bearer ${productsApiKey}`
      }
    }

    if (productData.return_url) {
      params.payload.return_url = productData.return_url
    }

    const url = productResource
    const defer = q.defer()
    const startTime = new Date()
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'create a product for a service',
      service: SERVICE_NAME
    }

    const callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToProductTransformer)

    requestLogger.logRequestStart(context)

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter)

    return defer.promise
  }
  /**
   * @param {Product} product
   * @param {long} priceOverride. (Optional) if a different price need to be charged to the one that is defined in product.
   * @returns Promise<Charge>
   */
  const createCharge = (product, priceOverride = undefined) => {
    const params = {
      correlationId: correlationId,
      payload: {
        external_product_id: product.externalProductId,
        amount: product.price
      },
      headers: {
        Authorization: `Bearer ${productsApiKey}`
      }
    }
    if (priceOverride) {
      params.payload.amount = priceOverride
    }

    const url = chargeResource
    const defer = q.defer()
    const startTime = new Date()
    const context = {
      url: url,
      defer: defer,
      startTime: startTime,
      correlationId: correlationId,
      method: 'POST',
      description: 'create a charge for a product',
      service: SERVICE_NAME
    }

    const callbackToPromiseConverter = createCallbackToPromiseConverter(context, responseBodyToChargeTransformer)

    requestLogger.logRequestStart(context)

    baseClient.post(url, params, callbackToPromiseConverter)
      .on('error', callbackToPromiseConverter)

    return defer.promise
  }

  return {
    createProduct,
    getProduct,
    createCharge
  }
}
