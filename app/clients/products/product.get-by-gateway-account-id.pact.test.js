'use strict'

const path = require('path')
const { Pact } = require('@pact-foundation/pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

const { PactInteractionBuilder } = require('../../../test/test-helpers/pact/pact-interaction-builder')
const productFixtures = require('../../../test/fixtures/product.fixtures')
const { pactify } = require('../../../test/test-helpers/pact/pact-base')()

// Constants
const API_RESOURCE = '/v1/api'
const port = Math.floor(Math.random() * 48127) + 1024

let response
let result
let gatewayAccountId

function getProductsClient (baseUrl = `http://127.0.0.1:${port}`, productsApiKey = 'ABC1234567890DEF') {
  return proxyquire('./products.client', {
    '../../../config': {
      PRODUCTS_URL: baseUrl
    }
  })
}

describe('products client - find products associated with a particular gateway account id', function () {
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

  describe('when products are successfully found', () => {
    before(done => {
      const productsClient = getProductsClient()
      gatewayAccountId = 42
      response = [
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId }),
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId }),
        productFixtures.validProductResponse({ gateway_account_id: gatewayAccountId })
      ]
      const interaction = new PactInteractionBuilder(`${API_RESOURCE}/gateway-account/${gatewayAccountId}/products`)
        .withUponReceiving('a valid get product by gateway account id request')
        .withState('three products with gateway account id 42 exist')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.map(item => pactify(item)))
        .build()
      provider.addInteraction(interaction)
        .then(() => productsClient.product.getByGatewayAccountId(gatewayAccountId))
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should find an existing products', () => {
      const plainResponse = response.map(item => item)
      expect(result.length).to.equal(3)
      result.forEach((product, index) => {
        expect(product.gatewayAccountId).to.equal(gatewayAccountId)
        expect(product.externalId).to.exist.and.equal(plainResponse[index].external_id)
        expect(product.name).to.exist.and.equal(plainResponse[index].name)
        expect(product.price).to.exist.and.equal(plainResponse[index].price)
        expect(product.language).to.exist.and.equal(plainResponse[index].language)
        expect(product).to.have.property('links')
        expect(Object.keys(product.links).length).to.equal(2)
        expect(product.links).to.have.property('self')
        expect(product.links.self).to.have.property('method').to.equal(plainResponse[index]._links.find(link => link.rel === 'self').method)
        expect(product.links.self).to.have.property('href').to.equal(plainResponse[index]._links.find(link => link.rel === 'self').href)
        expect(product.links).to.have.property('pay')
        expect(product.links.pay).to.have.property('method').to.equal(plainResponse[index]._links.find(link => link.rel === 'pay').method)
        expect(product.links.pay).to.have.property('href').to.equal(plainResponse[index]._links.find(link => link.rel === 'pay').href)
      })
    })
  })
})
