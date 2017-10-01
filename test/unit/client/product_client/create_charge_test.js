'use strict'

// NPM dependencies
const Pact = require('pact')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

// Custom dependencies
const pactProxy = require('../../../test_helpers/pact_proxy')
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const getProductsClient = require('../../../../app/services/clients/products_client')
const productFixtures = require('../../../fixtures/product_fixtures')
const Product = require('../../../../app/models/Product.class')

// Constants
const CHARGE_RESOURCE = '/v1/api/charges'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const productsClient = getProductsClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect
chai.should()

// Global setup
chai.use(chaiAsPromised)

describe('products client - create a new charge', function () {
  let productsMock

  /**
   * Start the server and set up Pact
   */
  before(function (done) {
    this.timeout(5000)
    mockServer.start().then(function () {
      productsMock = Pact({consumer: 'Selfservice-create-new-charge', provider: 'products', port: mockPort})
      done()
    })
  })

  /**
   * Remove the server and publish pacts to broker
   */
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('creating a charge', function () {
    context('create a charge - success', () => {
      let externalProductId = 'a-valid-product-id'
      let product = new Product(productFixtures.validCreateProductResponse({external_product_id: externalProductId}).getPlain())
      let validCreateChargeRequest = productFixtures.validCreateChargeRequest({
        external_product_id: externalProductId,
        amount: product.price
      })
      let validCreateChargeResponse = productFixtures.validCreateChargeResponse(
        {
          external_product_id: externalProductId,
          description: product.name,
          amount: product.price
        })
      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(CHARGE_RESOURCE)
            .withUponReceiving('a valid create charge create request')
            .withMethod('POST')
            .withRequestBody(validCreateChargeRequest.getPactified())
            .withStatusCode(201)
            .withResponseBody(validCreateChargeResponse.getPactified())
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        productsMock.finalize().then(() => done())
      })

      it('should create a new product', function (done) {
        productsClient.createCharge(product).should.be.fulfilled.then(charge => {
          expect(charge.externalProductId).to.equal(externalProductId)
          expect(charge.description).to.equal(product.name)
          expect(charge.amount).to.equal(product.price)
          expect(charge.selfLink.href).to.equal(`http://products.url/v1/api/charges/${charge.externalChargeId}`)
        }).should.notify(done)
      })
    })

    context('create a product - unauthorized', () => {
      const externalProductId = 'valid-id'
      let product = new Product(productFixtures.validCreateProductResponse({external_product_id: externalProductId}).getPlain())
      let validCreateChargeRequest = productFixtures.validCreateChargeRequest({external_product_id: externalProductId})

      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(CHARGE_RESOURCE)
            .withUponReceiving('a valid create charge request with invalid PRODUCTS_API_KEY')
            .withMethod('POST')
            .withRequestBody(validCreateChargeRequest.getPactified())
            .withStatusCode(401)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        productsMock.finalize().then(() => done())
      })

      it('should error unauthorised', function (done) {
        const productsClientWithInvalidToken = getProductsClient({
          baseUrl: `http://localhost:${mockPort}`,
          productsApiKey: 'invalid-api-key'
        })

        productsClientWithInvalidToken.createCharge(product).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(401)
        }).should.notify(done)
      })
    })

    context('create a charge - bad request', () => {
      const nonExistentProductId = 'invalid-id'
      let product = new Product(productFixtures.validCreateProductResponse({
        external_product_id: nonExistentProductId
      }).getPlain())
      let createChargeRequest = productFixtures.validCreateChargeRequest({
        external_product_id: nonExistentProductId,
        amount: product.price
      })

      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(CHARGE_RESOURCE)
            .withUponReceiving('an invalid create charge request')
            .withMethod('POST')
            .withRequestBody(createChargeRequest.getPactified())
            .withStatusCode(400)
            .build()
        ).then(() => {
          done()
        }).catch(e =>
          console.log(e)
        )
      })

      afterEach((done) => {
        productsMock.finalize().then(() => done())
      })

      it('should error bad request', function (done) {
        productsClient.createCharge(product).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(400)
        }).should.notify(done)
      })
    })
  })
})
