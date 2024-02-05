'use strict'

// NPM dependencies
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')

// Local dependencies
const { PRODUCTS_URL, ADMINUSERS_URL, SELFSERVICE_DASHBOARD_URL } = require('../../config')
const { getApp } = require('../../config/server')
const productFixtures = require('../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../test/fixtures/service.fixtures')
const paths = require('../paths')

describe('payment complete controller', () => {
  describe('when a demo payment is returned', () => {
    describe('and the payment was successful', () => {
      let product, payment, service, response
      before(done => {
        product = productFixtures.validProductResponse({ type: 'DEMO' })
        payment = productFixtures.validCreatePaymentResponse({
          govuk_status: 'SUCCESS',
          product_external_id: product.external_id
        })
        service = serviceFixtures.validServiceResponse()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should respond with status code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the payment success page', () => {
        expect(response.headers).to.have.property('location').to.equal(paths.demoPayment.success.replace(':productExternalId', product.external_id))
      })
    })

    describe('but the payment failed', () => {
      let product, payment, service, response
      before(done => {
        product = productFixtures.validProductResponse({ type: 'DEMO' })
        payment = productFixtures.validCreatePaymentResponse({
          govuk_status: 'ERROR',
          product_external_id: product.external_id
        })
        service = serviceFixtures.validServiceResponse()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            done(err)
          })
      })

      it('should respond with status code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the payment failed page', () => {
        expect(response.headers).to.have.property('location').to.equal(paths.demoPayment.failure.replace(':productExternalId', product.external_id))
      })
    })
  })

  describe('when a PROTOTYPE payment is returned', () => {
    let product, payment, service, response
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'PROTOTYPE',
        return_url: 'http://service.com/product-return'
      })
      payment = productFixtures.validCreatePaymentResponse({
        product_external_id: product.external_id
      })
      service = serviceFixtures.validServiceResponse()
      nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
      nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

      supertest(getApp())
        .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    it('should respond with status code 302', () => {
      expect(response.statusCode).to.equal(302)
    })

    it('should redirect to the payment success page', () => {
      expect(response.headers).to.have.property('location').to.equal(product.return_url)
    })
  })

  describe('when a ADHOC payment is returned', () => {
    let product, payment, service, response, $
    describe('when the payment was a success', () => {
      before(done => {
        product = productFixtures.validProductResponse({
          type: 'ADHOC'
        })
        payment = productFixtures.validCreatePaymentResponse({
          product_external_id: product.external_id,
          amount: 2000,
          reference_number: 'ABCD1234EF',
          govuk_status: 'success'
        })
        service = serviceFixtures.validServiceResponse()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should respond with status code 200', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should redirect to the payment success page', () => {
        expect($('title').text()).to.include(`Your payment was successful - ${service.service_name.en}`)
        expect($('.govuk-header__content').text()).to.include(product.name)
        expect($('#payment-reference').text()).to.equal('ABCD1234EF')
        expect($('#payment-amount').text()).to.equal('£20.00')
        expect($('a.dashboard-link').length).to.equal(0)
      })
    })

    describe('when the payment was a success for a Welsh product', () => {
      before(done => {
        product = productFixtures.validProductResponse({
          type: 'ADHOC',
          language: 'cy'
        })
        payment = productFixtures.validCreatePaymentResponse({
          product_external_id: product.external_id,
          amount: 2000,
          reference_number: 'ABCD1234EF',
          govuk_status: 'success'
        })
        service = serviceFixtures.validServiceResponse({
          service_name: {
            en: 'English service',
            cy: 'gwasanaeth Cymraeg'
          }
        })
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should respond with status code 200', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should redirect to the payment success page', () => {
        expect($('title').text()).to.include(`Roedd eich taliad yn llwyddiannus - ${service.service_name.cy}`)
        expect($('.govuk-header__content').text()).to.include(product.name)
        expect($('#payment-reference').text()).to.equal('ABCD1234EF')
        expect($('#payment-amount').text()).to.equal('£20.00')
        expect($('a.dashboard-link').length).to.equal(0)
      })
    })

    describe('when the payment has failed', () => {
      before(done => {
        product = productFixtures.validProductResponse({
          type: 'ADHOC'
        })
        payment = productFixtures.validCreatePaymentResponse({
          product_external_id: product.external_id,
          amount: 2000,
          reference_number: 'ABCD1234EF',
          govuk_status: 'failure'
        })
        service = serviceFixtures.validServiceResponse()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should redirect with status code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the payment start page', () => {
        expect(response.header).property('location').to.include(`/pay/${product.external_id}`)
      })
    })
  })

  describe('when a AGENT_INITIATED_MOTO payment is returned', () => {
    let product, payment, service, response, $
    describe('when the payment was a success', () => {
      before(done => {
        product = productFixtures.validProductResponse({
          type: 'AGENT_INITIATED_MOTO'
        })
        payment = productFixtures.validCreatePaymentResponse({
          product_external_id: product.external_id,
          amount: 2000,
          reference_number: 'ABCD1234EF',
          govuk_status: 'success'
        })
        service = serviceFixtures.validServiceResponse()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should respond with status code 200', () => {
        expect(response.statusCode).to.equal(200)
      })

      it('should redirect to the payment success page', () => {
        expect($('title').text()).to.include(`The payment was successful - ${service.service_name.en}`)
        expect($('.govuk-header__content').text()).to.include(service.service_name.en)
        expect($('#payment-reference').text()).to.equal('ABCD1234EF')
        expect($('#payment-amount').text()).to.equal('£20.00')
        expect($('a.dashboard-link').text()).to.include('Go to the dashboard')
        expect($('a.dashboard-link').attr('href')).to.equal(SELFSERVICE_DASHBOARD_URL)
      })
    })

    describe('when the payment has failed', () => {
      before(done => {
        product = productFixtures.validProductResponse({
          type: 'AGENT_INITIATED_MOTO'
        })
        payment = productFixtures.validCreatePaymentResponse({
          product_external_id: product.external_id,
          amount: 2000,
          reference_number: 'ABCD1234EF',
          govuk_status: 'failure'
        })
        service = serviceFixtures.validServiceResponse()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)
        nock(ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

        supertest(getApp())
          .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
          .end((err, res) => {
            response = res
            $ = cheerio.load(res.text || '')
            done(err)
          })
      })

      it('should redirect with status code 302', () => {
        expect(response.statusCode).to.equal(302)
      })

      it('should redirect to the payment start page', () => {
        expect(response.header).property('location').to.include(`/pay/${product.external_id}`)
      })
    })
  })

  describe('when a payment lookup fails', () => {
    let payment, response, $
    before(done => {
      payment = productFixtures.validCreatePaymentResponse()
      nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(404)

      supertest(getApp())
        .get(paths.pay.complete.replace(':paymentExternalId', payment.external_id))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code returned from products endpoint', () => {
      expect(response.statusCode).to.equal(404)
    })
    it('should render error page', () => {
      expect($('.govuk-heading-l').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('Sorry, we’re unable to process your request. Try again later.')
    })
  })
})
