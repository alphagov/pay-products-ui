'use strict'

const path = require('path')
const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { PactInteractionBuilder } = require('../../../test/test-helpers/pact/pact-interaction-builder')
const productFixtures = require('../../../test/fixtures/product.fixtures')
const { pactify } = require('../../../test/test-helpers/pact/pact-base')()

// Constants
const PRODUCT_RESOURCE = '/v1/api/products'
const port = Math.floor(Math.random() * 48127) + 1024

let response
let result
let productExternalId

function getProductsClient (baseUrl = `http://127.0.0.1:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('./products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a product by it\'s external id', function () {
  const provider = new Pact({
    consumer: 'products-ui',
    provider: 'products',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('when a product is successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'existing-id'
      response = productFixtures.validProductResponse({
        external_id: productExternalId,
        price: 1000,
        name: 'A Product Name',
        description: 'About this product',
        return_url: 'https://example.gov.uk',
        language: 'en'
      })
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid get product by external id request')
          .withState('a product with external id existing-id exists')
          .withMethod('GET')
          .withStatusCode(200)
          .withResponseBody(pactify(response))
          .build()
      )
        .then(() => productsClient.product.getByProductExternalId(productExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should find an existing product', () => {
      const plainResponse = response
      expect(result.externalId).to.equal(productExternalId)
      expect(result.name).to.exist.and.equal(plainResponse.name)
      expect(result.description).to.exist.and.equal(plainResponse.description)
      expect(result.price).to.exist.and.equal(plainResponse.price)
      expect(result.returnUrl).to.exist.and.equal(plainResponse.return_url)
      expect(result.language).to.exist.and.equal(plainResponse.language)
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

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      productExternalId = 'non-existing-id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PRODUCT_RESOURCE}/${productExternalId}`)
          .withUponReceiving('a valid find product by external id request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => productsClient.product.getByProductExternalId(productExternalId), done)
        .then(() => done(new Error('Promise unexpectedly resolved')))
        .catch((err) => {
          result = err
          done()
        })
    })

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
