'use strict'

// NPM dependencies
const path = require('path')
const Pact = require('pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const PactInteractionBuilder = require('../../../../fixtures/pact-interaction-builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product.fixtures')

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024

let request
let response
let result

function getProductsClient (baseUrl = `http://localhost:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('../../../../../app/services/clients/products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - create a new product', () => {
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
  after(() => provider.finalize())

  describe('when a product is successfully created', () => {
    before(done => {
      const productsClient = getProductsClient()
      request = productFixtures.validCreateProductRequest({
        description: 'a test product',
        returnUrl: 'https://example.gov.uk/paid-for-somet'
      })
      const requestPlain = request.getPlain()
      response = productFixtures.validCreateProductResponse(requestPlain)
      provider.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withUponReceiving('a valid create product request')
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(201)
          .withResponseBody(response.getPactified())
          .build()
      )
        .then(() => productsClient.product.create({
          gatewayAccountId: requestPlain.gateway_account_id,
          name: requestPlain.name,
          price: requestPlain.price,
          description: requestPlain.description,
          returnUrl: requestPlain.return_url
        }))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should create a new product', () => {
      const plainRequest = request.getPlain()
      const plainResponse = response.getPlain()
      expect(result.gatewayAccountId).to.equal(plainRequest.gateway_account_id)
      expect(result.name).to.equal(plainRequest.name)
      expect(result.description).to.equal(plainRequest.description)
      expect(result.price).to.equal(plainRequest.price)
      expect(result.returnUrl).to.equal('https://example.gov.uk/paid-for-somet')
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('pay')
      expect(result.links.pay).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'pay').method)
      expect(result.links.pay).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'pay').href)
    })
  })

  describe('when the request has invalid authorization credentials', () => {
    before(done => {
      const productsClient = getProductsClient(`http://localhost:${port}`, 'invalid-api-key')
      request = productFixtures.validCreateProductRequest()
      const requestPlain = request.getPlain()
      provider.addInteraction(
        new PactInteractionBuilder(PRODUCT_RESOURCE)
          .withMethod('POST')
          .withRequestBody(request.getPactified())
          .withStatusCode(401)
          .build()
      )
        .then(() => productsClient.product.create({
          gatewayAccountId: requestPlain.gateway_account_id,
          name: requestPlain.name,
          price: requestPlain.price,
          description: requestPlain.description,
          returnUrl: requestPlain.return_url
        }), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    it('should error unauthorised', () => {
      expect(result.errorCode).to.equal(401)
    })
  })

  // TODO : An invalid create product request should be based on something invalid? Not based on a valid request
  // describe('create a product - bad request', () => {
  //   before(done => {
  //     const productsClient = getProductsClient()
  //     request = productFixtures.validCreateProductRequest()
  //     const requestPlain = request.getPlain()
  //     provider.addInteraction(
  //       new PactInteractionBuilder(PRODUCT_RESOURCE)
  //         .withUponReceiving('an invalid create product request')
  //         .withMethod('POST')
  //         .withRequestBody(request.getPactified())
  //         .withStatusCode(400)
  //         .build()
  //     )
  //       .then(() => productsClient.product.create({
  //         gatewayAccountId: requestPlain.gateway_account_id,
  //         name: requestPlain.name,
  //         price: requestPlain.price,
  //         description: requestPlain.description,
  //         returnUrl: requestPlain.return_url
  //       }), done)
  //       .then(() => done(new Error('Promise unexpectedly resolved')))
  //       .catch((err) => {
  //         result = err
  //         done()
  //       })
  //   })
  //
  //   it('should reject with error: bad request', () => {
  //     expect(result.errorCode).to.equal(400)
  //   })
  // })
})
