'use strict'
const chai = require('chai')
const config = require('../../../../config')
const nock = require('nock')
const csrf = require('csrf')
const cheerio = require('cheerio')
const supertest = require('supertest')
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession } = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, payment, response, session, $

describe('adhoc payment submit-amount controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('variable amount ADHOC payment', function () {
    describe('when a valid amount is submitted', function () {
      const priceOverride = 995
      before(done => {
        product = productFixtures.validCreateProductResponse({
          type: 'ADHOC',
          product_name: 'Super duper product',
          service_name: 'Super GOV service',
          description: 'Super duper product description'
        }).getPlain()
        payment = productFixtures.validCreatePaymentResponse({
          govuk_status: 'SUCCESS',
          product_external_id: product.external_id,
          amount: priceOverride
        }).getPlain()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(config.PRODUCTS_URL).post(`/v1/api/products/${product.external_id}/payments`, { price: priceOverride }).reply(200, payment)

        supertest(createAppWithSession(getApp()))
          .post(paths.pay.product.replace(':productExternalId', product.external_id))
          .send({
            'payment-amount': '9.95',
            csrfToken: csrf().create('123')
          })
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should respond with code:303 redirect', () => {
        expect(response.statusCode).to.equal(303)
      })

      it('should redirect to the payment card details page', () => {
        expect(response.headers).to.have.property('location').to.equal(`http://frontend.url/charges/${payment.external_id}`)
      })
    })

    describe('when an empty amount is submitted', function () {
      before(done => {
        product = productFixtures.validCreateProductResponse({ type: 'ADHOC' }).getPlain()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        session = getMockSession()
        supertest(createAppWithSession(getApp(), session))
          .post(paths.pay.product.replace(':productExternalId', product.external_id))
          .send({
            csrfToken: csrf().create('123')
          })
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should respond with code:200 OK', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect($('.govuk-heading-m').text()).to.include(`Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”`)
      })
    })

    describe('when an invalid amount is submitted', function () {
      before(done => {
        product = productFixtures.validCreateProductResponse({ type: 'ADHOC' }).getPlain()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        session = getMockSession()
        const invalidAmount = 'GHTR89&&'
        supertest(createAppWithSession(getApp(), session))
          .post(paths.pay.product.replace(':productExternalId', product.external_id))
          .send({
            'payment-amount': invalidAmount,
            csrfToken: csrf().create('123')
          })
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should respond with code:200 OK', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect($('.govuk-heading-m').text()).to.include(`Choose an amount in pounds and pence using digits and a decimal point. For example “10.50”`)
      })
    })

    describe('when the amount is bigger than the max amount supported by Pay', function () {
      before(done => {
        product = productFixtures.validCreateProductResponse({ type: 'ADHOC' }).getPlain()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        session = getMockSession()
        const bigAmount = '100000000.50'
        supertest(createAppWithSession(getApp(), session))
          .post(paths.pay.product.replace(':productExternalId', product.external_id))
          .send({
            'payment-amount': bigAmount,
            csrfToken: csrf().create('123')
          })
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should respond with code:200 OK', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should add a relevant error message to the session \'flash\'', () => {
        expect($('.govuk-heading-m').text()).to.include(`Choose an amount under £100,000`)
      })
    })
  })

  describe('Fixed amount ADHOC payment', function () {
    describe('when the amount page is submitted', function () {
      before(done => {
        product = productFixtures.validCreateProductResponse({
          type: 'ADHOC',
          price: 2000,
          product_name: 'Super duper product',
          service_name: 'Super GOV service',
          description: 'Super duper product description'
        }).getPlain()
        payment = productFixtures.validCreatePaymentResponse({
          govuk_status: 'SUCCESS',
          product_external_id: product.external_id,
          amount: product.price
        }).getPlain()
        nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(config.PRODUCTS_URL).post(`/v1/api/products/${product.external_id}/payments`).reply(200, payment)

        supertest(createAppWithSession(getApp()))
          .post(paths.pay.product.replace(':productExternalId', product.external_id))
          .send({
            csrfToken: csrf().create('123')
          })
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should respond with code:303 redirect', () => {
        expect(response.statusCode).to.equal(303)
      })

      it('should redirect to the payment card details page', () => {
        expect(response.headers).to.have.property('location').to.equal(`http://frontend.url/charges/${payment.external_id}`)
      })
    })
  })
})
