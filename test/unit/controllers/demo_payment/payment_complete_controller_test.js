'use strict'

// NPM dependencies
const {expect} = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')

// Local dependencies
const {PRODUCTS_URL} = require('../../../../config')
const {getApp} = require('../../../../server')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')

describe('payment complete controller', () => {
  describe('when a demo payment is returned', () => {
    describe('and the payment was successful', () => {
      let product, payment, response
      before(done => {
        product = productFixtures.validCreateProductResponse({type: 'DEMO'}).getPlain()
        payment = productFixtures.validCreatePaymentResponse({
          govuk_status: 'SUCCESS',
          product_external_id: product.external_id
        }).getPlain()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)

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
        expect(response.headers).to.have.property('location').to.equal(paths.demoPayment.success)
      })
    })

    describe('but the payment failed', () => {
      let product, payment, response
      before(done => {
        product = productFixtures.validCreateProductResponse({type: 'DEMO'}).getPlain()
        payment = productFixtures.validCreatePaymentResponse({
          govuk_status: 'ERROR',
          product_external_id: product.external_id
        }).getPlain()
        nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
        nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)

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
        expect(response.headers).to.have.property('location').to.equal(paths.demoPayment.failure)
      })
    })
  })
  describe('when a PROTOTYPE payment is returned', () => {
    let product, payment, response
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'PROTOTYPE',
        return_url: 'http://service.com/product-return'
      }).getPlain()
      payment = productFixtures.validCreatePaymentResponse({
        product_external_id: product.external_id
      }).getPlain()
      nock(PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(PRODUCTS_URL).get(`/v1/api/payments/${payment.external_id}`).reply(200, payment)

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
  describe('when a payment lookup fails', () => {
    let payment, response, $
    before(done => {
      payment = productFixtures.validCreatePaymentResponse().getPlain()
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
      expect($('.page-title').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('Sorry, we are unable to process your request')
    })
  })
})
