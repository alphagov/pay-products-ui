'use strict'

// NPM dependencies
const Pact = require('pact')
const {expect} = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const pactProxy = require('../../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product_fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, response, result, productExternalId

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl,
      PRODUCTS_API_TOKEN: productsApiKey
    }
  })
}

describe('products client - find a payment by it\'s associated product external id', function () {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      productsMock = Pact({consumer: 'Selfservice-find-product', provider: 'products', port: mockPort})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(done => {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('when a product is successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'existing-id'
      response = productFixtures.validCreateChargeResponse({
        external_product_id: productExternalId,
        description: 'charge description',
        amount: 555
      })
      const interaction = new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/payments`)
        .withUponReceiving('a valid get payment request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.getPactified())
        .build()
      productsMock.addInteraction(interaction)
        .then(() => productsClient.payment.getByProductExternalId(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should find an existing payment', () => {
      const plainResponse = response.getPlain()
      expect(result.externalProductId).to.equal(productExternalId)
      expect(result.description).to.equal(plainResponse.description)
      expect(result.amount).to.equal(plainResponse.amount)
      expect(result.selfLink.href).to.equal(`http://products.url/v1/api/charges/${result.externalChargeId}`)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    beforeEach(done => {
      const productsClient = getProductsClient(`http://localhost:${mockPort}`, 'invalid-api-key')
      productExternalId = 'existing-id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('a valid find payment request with invalid PRODUCTS_API_TOKEN')
          .withMethod('GET')
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.payment.getByProductExternalId(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: 401 unauthorised', () => {
      expect(result.errorCode).to.equal(401)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'non-existing-id'
      productsMock.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}/payments`)
          .withUponReceiving('a valid find product request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.payment.getByProductExternalId(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
