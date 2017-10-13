'use strict'
const pactBase = require('./pact_base')

// Global setup
const pactProducts = pactBase()

module.exports = {
  pactifyRandomData: (opts = {}) => {
    pactProducts.pactify(opts)
  },

  validCreateChargeRequest: (opts = {}) => {
    const externalProductId = opts.external_product_id || 'product-externalId'
    const data = {
      external_product_id: externalProductId
    }
    if (opts.price_override) {
      data.amount = opts.price_override
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

  validCreateProductRequest: (opts = {}) => {
    const data = {
      gateway_account_id: opts.gatewayAccountId || Math.round(Math.random() * 1000) + 1,
      pay_api_token: opts.payApiToken || 'pay-api-token',
      name: opts.name || 'A Product Name',
      price: opts.price || Math.round(Math.random() * 10000) + 1
    }
    if (opts.description) data.description = opts.description
    if (opts.returnUrl) data.return_url = opts.returnUrl
    return {
      getPactified: () => {
        return pactProducts.pactify(data)
      },
      getPlain: () => {
        return data
      }
    }
  },

  validCreateChargeResponse: (opts = {}) => {
    const data = {
      external_product_id: opts.external_product_id || 'product-externalId',
      external_charge_id: opts.external_charge_id || 'charge-externalId',
      amount: opts.amount || Math.round(Math.random() * 1000) + 1,
      description: opts.description || 'The product name',
      _links: opts.links || [{
        href: `http://products.url/v1/api/charges/${(opts.external_charge_id || 'charge-externalId')}`,
        rel: 'self',
        method: 'GET'
      }, {
        href: `http://frontend.url/charges/${(opts.external_charge_id || 'charge-externalId')}`,
        rel: 'next',
        method: 'GET'
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
      external_id: opts.external_id || 'product-external-id',
      gateway_account_id: opts.gateway_account_id || Math.round(Math.random() * 1000) + 1,
      name: opts.name || 'A Product Name',
      price: opts.price || Math.round(Math.random() * 10000) + 1,
      _links: opts.links
    }
    if (opts.description) data.description = opts.description
    if (opts.return_url) data.return_url = opts.return_url
    if (!data._links) {
      data._links = [{
        href: `http://products.url/v1/api/products/${data.external_id}`,
        rel: 'self',
        method: 'GET'
      }, {
        href: `http://products-ui.url/pay/${data.external_id}`,
        rel: 'pay',
        method: 'GET'
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
  }
}
