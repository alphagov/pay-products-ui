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

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const mockPort = Math.floor(Math.random() * 65535)
const mockServer = pactProxy.create('localhost', mockPort)
const productsClient = getProductsClient({baseUrl: `http://localhost:${mockPort}`})
const expect = chai.expect
chai.should()

// Global setup
chai.use(chaiAsPromised)

describe('products client - find a new product', function () {
  let productsMock

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
  after(function (done) {
    mockServer.delete()
      .then(() => pactProxy.removeAll())
      .then(() => done())
  })

  describe('find a product', function () {
    context('find product - success', () => {
      const externalProductId = 'existing-id'
      let validProductResponse = productFixtures.validCreateProductResponse(
        {
          external_product_id: externalProductId
        }
      )

      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${externalProductId}`)
            .withUponReceiving('a valid get product request')
            .withMethod('GET')
            .withStatusCode(200)
            .withResponseBody(validProductResponse.getPactified())
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

      it('should find an existing product', function (done) {
        productsClient.getProduct(externalProductId).should.be.fulfilled.then(product => {
          expect(product.externalProductId).to.equal(externalProductId)
          expect(product.payApiKey).to.equal('a-valid_pay-api-key')
          expect(product.name).to.equal('A Product Name')
          expect(product.description).to.equal('A Product description')
          expect(product.price).to.equal(1000)
          expect(product.returnUrl).to.equal('http://some.return.url/')
          expect(product.payLink.href).to.equal(`http://products-ui.url/pay/${externalProductId}`)
          expect(product.selfLink.href).to.equal(`http://products.url/v1/api/products/${externalProductId}`)
        }).should.notify(done)
      })
    })

    context('find product - unauthorized', () => {
      const externalProductId = 'existing-id'
      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${externalProductId}`)
            .withUponReceiving('a valid find product request with invalid PRODUCTS_API_KEY')
            .withMethod('GET')
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

        productsClientWithInvalidToken.getProduct(externalProductId).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(401)
        }).should.notify(done)
      })
    })

    context('find product - not found', () => {
      const nonExistentId = 'non-existing-id'
      beforeEach((done) => {
        productsMock.addInteraction(
          new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${nonExistentId}`)
            .withUponReceiving('a valid find product request with non existing id')
            .withMethod('GET')
            .withStatusCode(404)
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

      it('should error not found', function (done) {
        productsClient.getProduct(nonExistentId).should.be.rejected.then(response => {
          expect(response.errorCode).to.equal(404)
        }).should.notify(done)
      })
    })
  })
})
