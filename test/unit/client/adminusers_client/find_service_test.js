'use strict'

// NPM dependencies
const path = require('path')
const Pact = require('pact')
const { expect } = require('chai')
const proxyquire = require('proxyquire')

// Custom dependencies
const PactInteractionBuilder = require('../../../fixtures/pact_interaction_builder').PactInteractionBuilder
const serviceFixtures = require('../../../fixtures/service_fixtures')

const ADMINUSERS_RESOURCE = '/v1/api/services'
const port = Math.floor(Math.random() * 48127) + 1024

function getAdminusersClient (baseUrl = `http://localhost:${port}`) {
  return proxyquire('../../../../app/services/clients/adminusers_client', {
    '../../../config': {
      ADMINUSERS_URL: baseUrl
    }
  })
}

describe('adminusers client - find a service associated with a particular gateway account id', function () {
  const provider = Pact({
    consumer: 'products-ui',
    provider: 'adminusers',
    port: port,
    log: path.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2,
    pactfileWriteMode: 'merge'
  })

  let gatewayAccountId, response, result

  before(() => provider.setup())
  after(() => provider.finalize())

  describe('when a service is found', () => {
    const customBranding = {
      css_url: 'https://example.org/mycss',
      image_url: 'https://example.org/myimage'
    }
    before(done => {
      const adminusersClient = getAdminusersClient()
      gatewayAccountId = 111
      const serviceData = {
        gateway_account_ids: [`${gatewayAccountId}`],
        custom_branding: customBranding
      }

      response = serviceFixtures.validServiceResponse(serviceData)

      const interaction = new PactInteractionBuilder(ADMINUSERS_RESOURCE)
        .withQuery('gatewayAccountId', `${gatewayAccountId}`)
        .withUponReceiving('a valid get service by gateway account id request')
        .withState('a service exists with custom branding and a gateway account with id 111')
        .withMethod('GET')
        .withStatusCode(200)
        .withResponseBody(response.getPactified())
        .build()
      provider.addInteraction(interaction)
        .then(() => adminusersClient.getServiceByGatewayAccountId(gatewayAccountId, 'correlation_id'), done)
        .then(res => {
          result = res
          done()
        })
        .catch(e => done(e))
    })

    it('should find a service', () => {
      const plainResponse = response.getPlain()
      expect(result.serviceName.en).to.equal(plainResponse.service_name.en)
      expect(result.name).to.equal(plainResponse.name)
      expect(result.externalId).to.equal(plainResponse.external_id)
      expect(result.gatewayAccountIds[0]).to.equal(`${gatewayAccountId}`)
      expect(result.customBranding.cssUrl).to.equal(plainResponse.custom_branding.css_url)
      expect(result.customBranding.imageUrl).to.equal(plainResponse.custom_branding.image_url)
    })
  })

  describe('when a service is not found', () => {
    before(done => {
      const adminusersClient = getAdminusersClient()
      gatewayAccountId = 123457
      provider.addInteraction(
        new PactInteractionBuilder(ADMINUSERS_RESOURCE)
          .withQuery('gatewayAccountId', `${gatewayAccountId}`)
          .withUponReceiving('a valid find service request with non existing gateway account id')
          .withMethod('GET')
          .withStatusCode(404)
          .withResponseHeaders({})
          .build()
      )
        .then(() => adminusersClient.getServiceByGatewayAccountId(gatewayAccountId, 'correlation_id'), done)
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
