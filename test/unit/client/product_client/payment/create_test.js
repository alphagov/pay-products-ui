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
const PAYMENTS_RESOURCE = '/v1/api/payments'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
let productsMock, result, externalProductId

function getProductsClient (baseUrl = `http://localhost:${mockPort}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl,
      PRODUCTS_API_TOKEN: productsApiKey
    }
  })
}

describe('products client - creating a new payment', () => {
  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(() => {
      productsMock = Pact({consumer: 'Selfservice-create-new-charge', provider: 'products', port: mockPort})
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

  describe('when a charge is successfully created', () => {
    before((done) => {
      const productsClient = getProductsClient()
      externalProductId = 'a-valid-product-id'
      const request = productFixtures.validCreateChargeRequest({
        external_product_id: externalProductId
      })
      const response = productFixtures.validCreateChargeResponse({
        external_product_id: externalProductId,
        description: 'charge description',
        amount: 555
      })
      productsMock.addInteraction(
        new PactInteractionBuilder(PAYMENTS_RESOURCE)
          .withUponReceiving('a valid create charge create request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(201)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.payment.create(externalProductId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    after((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should create a new product', () => {
      expect(result.externalProductId).to.equal(externalProductId)
      expect(result.description).to.equal('charge description')
      expect(result.amount).to.equal(555)
      expect(result.selfLink.href).to.equal(`http://products.url/v1/api/charges/${result.externalChargeId}`)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    before(done => {
      const productsClient = getProductsClient(`http://localhost:${mockPort}`, 'invalid-api-key')
      externalProductId = 'valid-id'
      const request = productFixtures.validCreateChargeRequest({external_product_id: externalProductId})
      productsMock.addInteraction(
        new PactInteractionBuilder(PAYMENTS_RESOURCE)
          .withUponReceiving('a valid create charge request with invalid PRODUCTS_API_TOKEN')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.payment.create(externalProductId), err => done(err))
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach((done) => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error unauthorised', () => {
      expect(result.errorCode).to.equal(401)
    })
  })

  describe('when creating a charge using a malformed request', () => {
    beforeEach(done => {
      const productsClient = getProductsClient()
      const request = {}
      productsMock.addInteraction(
        new PactInteractionBuilder(PAYMENTS_RESOURCE)
          .withUponReceiving('an invalid create charge request')
          .withMethod('POST')
          .withRequestBody(productFixtures.pactifyRandomData(request))
          .withStatusCode(400)
          .build()
      )
        .then(() => productsClient.payment.create('a-product-id'), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    afterEach(done => {
      productsMock.finalize().then(() => done())
    })

    it('should reject with error: bad request', () => {
      expect(result.errorCode).to.equal(400)
    })
  })
})
