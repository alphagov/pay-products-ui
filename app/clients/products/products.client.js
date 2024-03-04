'use strict'

// Local Dependencies
const Product = require('../../models/Product.class')
const Payment = require('../../models/Payment.class')
const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('../base/config')
const { PRODUCTS_URL } = require('../../../config')

// Constants
const SERVICE_NAME = 'products'

// Use baseurl to create a baseclient for the product microservice
const baseUrl = `${PRODUCTS_URL}/v1/api`

// Exports
module.exports = {
  product: {
    getByProductExternalId: getProductByExternalId,
    getByProductPath: getProductByPath,
    getByGatewayAccountId: getProductsByGatewayAccountId
  },
  payment: {
    create: createPayment,
    getByPaymentExternalId: getPaymentByPaymentExternalId,
    getByProductExternalId: getPaymentsByProductExternalId
  }
}

/**
 * @param {String} externalProductId: the external id of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
async function getProductByExternalId (externalProductId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products/${externalProductId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a product by it\'s external id')
  return new Product(response.data)
}

/**
 * @param {String} serviceNamePath: the service name path of the product you wish to retrieve
 * @param {String} productNamePath: the product name path of the product you wish to retrieve
 * @returns {Promise<Product>}
 */
async function getProductByPath (serviceNamePath, productNamePath) {
    this.client = new Client(SERVICE_NAME)
    const url = `${baseUrl}/products?serviceNamePath=${serviceNamePath}&productNamePath=${productNamePath}`
    configureClient(this.client, url)
    const response = await this.client.get(url, 'find a product by it\'s product path')
    return new Product(response.data)
}

/**
 * @param {String} gatewayAccountId - The id of the gateway account to retrieve products associated with
 * @returns {Promise<Array<Product>>}
 */
async function getProductsByGatewayAccountId (gatewayAccountId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/gateway-account/${gatewayAccountId}/products`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a list products associated with a gateway account')
  return response.data.map(product => new Product(product))
}

// PAYMENT
/**
 * @param {String} productExternalId The external ID of the product to create a payment for
 * @param {int} price: The override price for the payment. If not present it will default to product price
 * @returns Promise<Payment>
 */
async function createPayment (productExternalId, price, referenceNumber) {
  const createPaymentRequest = {
    baseUrl,
    url: `/products/${productExternalId}/payments`,
    description: 'create a payment for a product',
    service: SERVICE_NAME
  }
  createPaymentRequest.body = {}
  if (price) {
    createPaymentRequest.body.price = price
  }
  if (referenceNumber) {
    createPaymentRequest.body.reference_number = referenceNumber
  }
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products/${productExternalId}/payments`
  configureClient(this.client, url)
  const response = await this.client.post(url, createPaymentRequest.body, 'create a payment for a product')
  return new Payment(response.data)
}

/**
 * @param {String} paymentExternalId
 * @returns Promise<Payment>
 */
async function getPaymentByPaymentExternalId (paymentExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/payments/${paymentExternalId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a payment by it\'s external id')
  return new Payment(response.data)
}

/**
 * @param {String} productExternalId
 * @returns Promise<Array<Payment>>
 */
async function getPaymentsByProductExternalId (productExternalId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/products/${productExternalId}/payments`
  configureClient(this.client, url)
  const response = await  this.client.get(url, 'find a payments associated with a particular product')
  return response.data.map(payment => new Payment(payment))
}
