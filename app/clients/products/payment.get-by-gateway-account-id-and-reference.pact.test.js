'use strict'

const path = require('path')
const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { PactInteractionBuilder } = require('../../../test/test-helpers/pact/pact-interaction-builder')
const productFixtures = require('../../../test/fixtures/product.fixtures')
const { pactify } = require('../../../test/test-helpers/pact/pact-base')()

// Constants
const port = Math.floor(Math.random() * 48127) + 1024

let response, result, gatewayAccountId, referenceNumber

function getProductsClient (baseUrl = `http://127.0.0.1:${port}`) {
  return proxyquire('./products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a payment by gateway account id and payment reference number', function () {
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

  describe('when a payment is successfully found', () => {
    before((done) => {
      const productsClient = getProductsClient()
      gatewayAccountId = 'existing-id'
      referenceNumber = 'REFERENCE1'
      response = productFixtures.validCreatePaymentResponse({ reference_number: referenceNumber })
      const interaction = new PactInteractionBuilder(`/v1/api/payments/${gatewayAccountId}/${referenceNumber}`)
        .withUponReceiving('a valid get payment by gateway account id and reference request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(pactify(response))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.payment.getByGatewayAccountIdAndReference(gatewayAccountId, referenceNumber))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should find an existing payment', () => {
      const plainResponse = response
      expect(result.productExternalId).to.equal(plainResponse.product_external_id)
      expect(result.status).to.equal(plainResponse.status)
      expect(result.reference_number).to.equal(plainResponse.referenceNumber)
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

  describe('when a payment is not found', () => {
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 'existing-id'
      referenceNumber = 'NON_EXISTING_REFERENCE'
      const interaction = new PactInteractionBuilder(`/v1/api/payments/${gatewayAccountId}/${referenceNumber}`)
        .withUponReceiving('a valid find payment request with non existing reference')
        .withMethod('GET')
        .withStatusCode(404)
        .build()

      provider.addInteraction(interaction)
        .then(() => productsClient.payment.getByGatewayAccountIdAndReference(gatewayAccountId, referenceNumber), done)
        .catch((err) => {
          // getByGatewayAccountIdAndReference is throwing an error on 404 ..
          result = err
          done()
        })
    })

    it('should reject with error: 404 not found', () => {
      expect(result.errorCode).to.equal(404)
    })
  })
})
