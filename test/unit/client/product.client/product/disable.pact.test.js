'use strict'

// NPM dependencies
const path = require('path')
const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024

let result
let productExternalId

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - disable a product', () => {
  const provider = new Pact({
    consumer: 'products-ui-to-be',
    provider: 'products',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('when a product is successfully disabled', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_valid_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/disable`)
          .withUponReceiving('a valid disable product request')
          .withMethod('PATCH')
          .withStatusCode(204)
          .build()
      )
        .then(() => productsClient.product.disable(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should create a new product', () => {
      expect(result).to.equal(undefined)
    })
  })

  describe('disable a product - bad request', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_non_existent_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/disable`)
          .withUponReceiving('an invalid disable product request')
          .withMethod('PATCH')
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.product.disable(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
