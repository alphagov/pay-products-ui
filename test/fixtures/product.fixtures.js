'use strict'
const pactBase = require('./pact-base')

// Global setup
const pactProducts = pactBase()

module.exports = {
  pactifyRandomData: (opts = {}) => {
    pactProducts.pactify(opts)
  },

  validCreateProductRequest: (opts = {}) => {
    const data = {
      gateway_account_id: opts.gatewayAccountId || 666,
      name: opts.name || 'A Product Name',
      price: opts.price || 1000
    }
    if (opts.description) data.description = opts.description
    if (opts.returnUrl) data.return_url = opts.returnUrl
    if (opts.service_name_path) data.service_name_path = opts.service_name_path
    if (opts.product_name_path) data.product_name_path = opts.product_name_path
    return {
      getPactified: () => {
        return pactProducts.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validCreatePaymentResponse: (opts = {}) => {
    const data = {
      external_id: opts.external_id || 'a-payment-external-id',
      product_external_id: opts.product_external_id || 'a-product-external-id',
      next_url: opts.next_url || 'http://service.url/next',
      status: opts.status || 'CREATED',
      amount: opts.amount || 100,
      reference_number: opts.reference_number || 'CF3HFN8I9H',
      govuk_status: opts.govuk_status || 'success',
      _links: opts.links
    }
    if (!data._links) {
      data._links = [{
        href: `http://products.url/v1/api/payments/${(data.external_id)}`,
        rel: 'self',
        method: 'GET'
      }, {
        href: `http://frontend.url/charges/${(data.external_id)}`,
        rel: 'next',
        method: 'POST'
      }]
    }

    return {
      getPactified: () => {
        return pactProducts.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validCreateProductResponse: (opts = {}) => {
    const data = {
      external_id: opts.external_id || 'an-external-id',
      type: opts.type || 'DEMO',
      gateway_account_id: opts.gateway_account_id || 666,
      name: opts.name || 'A Product Name',
      description: opts.description || '',
      price: opts.price,
      language: opts.language || 'en',
      _links: opts.links
    }
    if (data.type !== 'ADHOC') {
      data.price = data.price || 1000
    }
    if (opts.reference_enabled) data.reference_enabled = opts.reference_enabled
    if (opts.reference_label) data.reference_label = opts.reference_label
    if (opts.reference_hint) data.reference_hint = opts.reference_hint
    if (opts.description) data.description = opts.description
    if (opts.return_url) data.return_url = opts.return_url
    if (opts.service_name_path) data.service_name_path = opts.service_name_path
    if (opts.product_name_path) data.product_name_path = opts.product_name_path
    if (opts.require_captcha !== undefined) data.require_captcha = opts.require_captcha
    if (!data._links) {
      data._links = [{
        href: `http://products.url/v1/api/products/${data.external_id}`,
        rel: 'self',
        method: 'GET'
      }]
    }
    if (data.reference_enabled) {
      data._links.push({
        href: `http://products-ui.url/pay/reference/${data.external_id}`,
        rel: 'pay',
        method: 'GET'
      })
    } else {
      data._links.push({
        href: `http://products-ui.url/pay/${data.external_id}`,
        rel: 'pay',
        method: 'GET'
      })
    }
    if (opts.service_name_path && opts.product_name_path) {
      data._links.push({
        href: `http://products-ui.url/redirect/${opts.service_name_path}/${opts.product_name_path}`,
        rel: 'friendly',
        method: 'GET'
      })
    }

    return {
      getPactified: () => {
        return pactProducts.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  }
}
