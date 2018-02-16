'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const currencyFormatter = require('currency-formatter')
const {getApp} = require('../../../../server')
const {createAppWithSession} = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, response, $

function asGBP (amountInPence) {
  return currencyFormatter.format((amountInPence / 100).toFixed(2), {code: 'GBP'})
}

describe('adhoc payment get-amount controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('variable amount adhoc payment', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description'
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .post(paths.pay.product.replace(':productExternalId', product.external_id))
        .send({csrfToken: csrf().create('123')})
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render adhoc payment get amount page', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('form').attr('action')).to.equal(`/pay/${product.external_id}/enter-amount`)
    })
  })

  describe('Fixed amount adhoc payment', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        price: 3000,
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description'
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .post(paths.pay.product.replace(':productExternalId', product.external_id))
        .send({csrfToken: csrf().create('123')})
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render adhoc payment get amount page', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('h2#payment-amount').text()).to.include(asGBP(product.price))
      expect($('form').attr('action')).to.equal(`/pay/${product.external_id}/enter-amount`)
    })
  })
})
