'use strict'

const path = require('path')
const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { PactInteractionBuilder } = require('../../../test/test-helpers/pact/pact-interaction-builder')
const productFixtures = require('../../../test/fixtures/product.fixtures')
const { pactify } = require('../../../test/test-helpers/pact/pact-base')()

// Constants
const PAYMENT_RESOURCE = '/v1/api/payments'
const port = Math.floor(Math.random() * 48127) + 1024

let response
let result
let paymentExternalId

function getProductsClient (baseUrl = `http://127.0.0.1:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('./products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a payment by it\'s own external id', function () {
  const provider = new Pact({
    consumer: 'products-ui-to-be',
    provider: 'products',
    port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  before(() => provider.setup())
  after(() => provider.finalize())
  afterEach(() => provider.verify())

  describe('when a product is successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      paymentExternalId = 'existing-id'
      response = productFixtures.validCreatePaymentResponse({ external_id: paymentExternalId })
      const interaction = new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
        .withUponReceiving('a valid get payment by external id request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(pactify(response))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should find an existing payment', () => {
      const plainResponse = response
      expect(result.productExternalId).to.equal(plainResponse.product_external_id)
      expect(result.externalId).to.equal(plainResponse.external_id).and.to.equal(paymentExternalId)
      expect(result.status).to.equal(plainResponse.status)
      expect(result.nextUrl).to.equal(plainResponse.next_url)
      expect(result).to.have.property('links')
      expect(Object.keys(result.links).length).to.equal(2)
      expect(result.links).to.have.property('self')
      expect(result.links.self).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'self').method)
      expect(result.links.self).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'self').href)
      expect(result.links).to.have.property('next')
      expect(result.links.next).to.have.property('method').to.equal(plainResponse._links.find(link => link.rel === 'next').method)
      expect(result.links.next).to.have.property('href').to.equal(plainResponse._links.find(link => link.rel === 'next').href)
    })
  })

  describe('when a product is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      paymentExternalId = 'non-existing-id'
      provider.addInteraction(
        new PactInteractionBuilder(`${PAYMENT_RESOURCE}/${paymentExternalId}`)
          .withUponReceiving('a valid get payment by external id request with non existing id')
          .withMethod('GET')
          .withStatusCode(404)
          .build()
      )
        .then(() => productsClient.payment.getByPaymentExternalId(paymentExternalId), done)
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
