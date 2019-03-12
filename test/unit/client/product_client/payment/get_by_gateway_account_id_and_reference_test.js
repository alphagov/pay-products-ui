'use strict'

// NPM dependencies
const path = require('path')
const Pact = require('pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const PactInteractionBuilder = require('../../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const productFixtures = require('../../../../fixtures/product_fixtures')

// Constants
const port = Math.floor(Math.random() * 48127) + 1024

let response, result, gatewayAccountId, referenceNumber

function getProductsClient (baseUrl = `http://localhost:${port}`) {
  return proxyquire('../../../../../app/services/clients/products_client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find a payment by gateway account id and payment reference number', function () {
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

  describe('when a payment is successfully found', () => {
    before((done) => {
      const productsClient = getProductsClient()
      gatewayAccountId = 'existing-id'
      referenceNumber = 'REFERENCE1'
      response = productFixtures.validCreatePaymentResponse({ reference_number: referenceNumber })
      const interaction = new PactInteractionBuilder(`/v1/api/payments/${gatewayAccountId}/${referenceNumber}`)
        .withUponReceiving('a valid get payment request')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.getPactified())
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
      const plainResponse = response.getPlain()
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
