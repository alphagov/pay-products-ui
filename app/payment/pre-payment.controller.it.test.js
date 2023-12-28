'use strict'

const chai = require('chai')
const config = require('../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const { getApp } = require('../../config/server')
const { createAppWithSession } = require('../../test/test-helpers/mock-session')
const productFixtures = require('../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../test/fixtures/service.fixtures')
const paths = require('../paths')
const expect = chai.expect
let product, payment, service, response, $
describe('pre payment controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  const demoPrototype = ['DEMO', 'PROTOTYPE']

  demoPrototype.forEach((type) => {
    describe(`when the payment type is ${type}`, () => {
      describe('and payment creation is successful', () => {
        before(done => {
          product = productFixtures.validProductResponse({ type: type })
          payment = productFixtures.validCreatePaymentResponse()
          service = serviceFixtures.validServiceResponse()
          nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
          nock(config.PRODUCTS_URL).post(`/v1/api/products/${product.external_id}/payments`).reply(200, payment)
          nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

          supertest(createAppWithSession(getApp()))
            .get(paths.pay.product.replace(':productExternalId', product.external_id))
            .end((err, res) => {
              response = res
              done(err)
            })
        })
        it('should redirect with code: 303 \'See Other\'', () => {
          expect(response.statusCode).to.equal(303)
        })
        it('should redirect to next_url', () => {
          expect(response.header).property('location').to.equal(payment._links.find(link => link.rel === 'next').href)
        })
      })
      describe('and payment creation fails', () => {
        before(done => {
          product = productFixtures.validProductResponse({ type: type })
          service = serviceFixtures.validServiceResponse()
          nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
          nock(config.PRODUCTS_URL).post(`/v1/api/products/${product.external_id}/payments`).reply(400)
          nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

          supertest(createAppWithSession(getApp()))
            .get(paths.pay.product.replace(':productExternalId', product.external_id))
            .end((err, res) => {
              response = res
              $ = cheerio.load(res.text || '')
              done(err)
            })
        })
        it('should respond with code returned from charges endpoint', () => {
          expect(response.statusCode).to.equal(400)
        })
        it('should render error page', () => {
          expect($('.govuk-heading-l').text()).to.equal('An error occurred:')
          expect($('#errorMsg').text()).to.equal('Sorry, we’re unable to process your request. Try again later.')
        })
      })
      describe('and the product is not resolved', () => {
        before(done => {
          product = productFixtures.validProductResponse({ type: type })
          nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(404)
          supertest(createAppWithSession(getApp()))
            .get(paths.pay.product.replace(':productExternalId', product.external_id))
            .end((err, res) => {
              response = res
              $ = cheerio.load(res.text || '')
              done(err)
            })
        })
        it('should respond with code returned from products endpoint', () => {
          expect(response.statusCode).to.equal(302)
        })
      })
    })
  })

  const adHocAgentInitiatedMoto = ['ADHOC', 'AGENT_INITIATED_MOTO']

  adHocAgentInitiatedMoto.forEach((type) => {
    describe(`when the payment type is ${type} and reference is disabled`, () => {
      before(done => {
        product = productFixtures.validProductResponse({ type: type, name: 'A Product Name' })
        service = serviceFixtures.validServiceResponse()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(createAppWithSession(getApp()))
          .get(paths.pay.product.replace(':productExternalId', product.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })
      it('should respond with code: 200 \'OK\'', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should render the payment amount page', () => {
        expect($('.govuk-heading-l').text()).to.include('A Product Name')
      })
    })

    describe(`when the payment type is ${type} and reference is enabled`, () => {
      before(done => {
        const opts = {
          type: type,
          name: 'Featured Product',
          reference_enabled: 'true'
        }
        product = productFixtures.validProductResponse(opts)
        service = serviceFixtures.validServiceResponse()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(createAppWithSession(getApp()))
          .get(paths.pay.reference.replace(':productExternalId', product.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })
      it('should respond with code: 200 \'OK\'', () => {
        expect(response.statusCode).to.equal(200)
      })
      it('should render the payment reference page', () => {
        expect($('.govuk-heading-l').text()).to.include('Featured Product')
      })
    })
  })

  describe('when the payment type is UNKNOWN', () => {
    before(done => {
      product = productFixtures.validProductResponse({ type: 'UNKNOWN' })
      service = serviceFixtures.validServiceResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

      supertest(createAppWithSession(getApp()))
        .get(paths.pay.product.replace(':productExternalId', product.external_id))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it('should respond with code returned from products endpoint', () => {
      expect(response.statusCode).to.equal(500)
    })
    it('should render error page', () => {
      expect($('.govuk-heading-l').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('Sorry, we’re unable to process your request. Try again later.')
    })
  })
})
