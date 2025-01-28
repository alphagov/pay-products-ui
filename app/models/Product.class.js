'use strict'

// NPM Dependencies
const lodash = require('lodash')

/**
 @class Product
 * @property {string} externalId - The external ID of the product
 * @property {string} gatewayAccountId
 * @property {string} name
 * @property {number} price
 * @property {string} type - The type of the product
 * @property {string} description
 * @property {string} returnUrl
 * @property {string} serviceName - the name of the service with which the product is associated
 * @property {Object} referenceEnabled - a flag that when enabled will ask for the payer to input a reference
 * @property {Object} referenceLabel - a required field when reference is enabled
 * @property {Object} referenceHint - a an optional field when reference is enabled
 * @property {Object} language - the iso639 2 character code for the language to display pages in
 * @property {object} links
 * @property {object} links.pay
 * @property {string} links.pay.href - url to use to create a payment for the product
 * @property {string} links.pay.method - the http method to use to create a payment for the product
 * @property {object} links.self
 * @property {string} links.self.href - url to use to re-fetch the product
 * @property {string} links.self.method - the http method to use to re-fetch the product
 * @property {boolean} isTestPaymentLink - boolean flag indicating if this payment link is for a test gateway account
 */
class Product {
  /**
   * Create an instance of Product
   * @param {Object} opts - raw 'product' object from server
   * @param {string} opts.external_id - The external ID of the product
   * @param {string} opts.type - The type of the product
   * @param {string} opts.gateway_account_id - The id of the product's associated gateway account
   * @param {string} opts.name - The name of the product
   * @param {number} opts.price - price of the product in pence
   * @param {string} opts.service_name - the name of the service with which the product is associated
   * @param {string} opts.reference_enabled - when enabled will ask the user to input a reference for the payment
   * @param {string} opts.reference_label - mandatory field that will display when reference is enabled
   * @param {string} opts.reference_hint - optional field that will display when reference is enabled
   * @param {string} opts.amountHint - optional field that will display when amount is user-provided
   * @param {string} opts.language - the language pages are displayed in for the product
   * @param {Object[]} opts._links - links for the product ('self' to re-GET this product from the server, and 'pay' to create a payment for this product)
   * @param {string} opts._links[].href - url of the link
   * @param {string} opts._links[].method - the http method of the link
   * @param {string} opts._links[].rel - the name of the link
   * @param {string=} opts.description - The name of the product
   * @param {string=} opts.return_url - return url of where to redirect for any charge of this product
   * @param {string} opts.pay_api_token - api token used by the payment link
   **/
  constructor (opts) {
    this.externalId = opts.external_id
    this.type = opts.type
    this.gatewayAccountId = opts.gateway_account_id
    this.name = opts.name
    this.price = opts.price
    this.govukStatus = opts.govuk_status
    this.serviceName = opts.service_name || 'Example Service Name'
    this.description = opts.description
    this.returnUrl = opts.return_url
    this.reference_enabled = opts.reference_enabled
    this.reference_label = opts.reference_label
    this.reference_hint = opts.reference_hint
    this.amountHint = opts.amount_hint
    this.language = opts.language
    this.requireCaptcha = opts.require_captcha
    this.isTestPaymentLink = opts?.pay_api_token?.startsWith('api_test_') ?? false // used in layout and test-payment-notification-banner njk templates
    opts._links.forEach(link => lodash.set(this, `links.${link.rel}`, { method: link.method, href: link.href }))
  }
}

module.exports = Product
