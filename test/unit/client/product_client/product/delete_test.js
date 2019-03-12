'use strict'

// NPM dependencies
const path = require('path')
const Pact = require('pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024

let result
let productExternalId

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - delete a product', () => {
  const provider = Pact({
    consumer: 'products-ui-to-be',
    provider: 'products',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after((done) => provider.finalize().then(() => { done() }))

  describe('when a product is successfully deleted', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_valid_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid delete product request')
          .withMethod('DELETE')
          .withStatusCode(204)
          .build()
      )
        .then(() => productsClient.product.delete(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should not have a result', () => {
      expect(result).to.equal(undefined)
    })
  })

  describe('delete a product - bad request', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'a_non_existant_external_id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('an invalid create product request')
          .withMethod('DELETE')
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.product.delete(productExternalId), done)
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
