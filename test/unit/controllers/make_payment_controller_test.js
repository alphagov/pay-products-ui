'use strict'

const chai = require('chai')
const config = require('../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const {getApp} = require('../../../server')
const {createAppWithSession} = require('../../test_helpers/mock_session')
const productFixtures = require('../../fixtures/product_fixtures')
const paths = require('../../../app/paths')
const expect = chai.expect
let product, charge, response, $
describe('make payment controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })
  describe('when charge creation is successful', () => {
    before(done => {
      product = productFixtures.validCreateProductResponse({external_id: 'abc1234567890def'}).getPlain()
      charge = productFixtures.validCreateChargeResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.PRODUCTS_URL).post('/v1/api/charges', {external_product_id: product.external_id}).reply(200, charge)

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
      expect(response.header).property('location').to.equal(charge._links.find(link => link.rel === 'next').href)
    })
  })
  describe('when charge creation fails', () => {
    before(done => {
      product = productFixtures.validCreateProductResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.PRODUCTS_URL).post('/v1/api/charges', {external_product_id: product.external_id}).reply(400)
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
      expect($('.page-title').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('We are unable to process your request at this time')
    })
  })

  describe('when the product is not resolved', () => {
    before(done => {
      product = productFixtures.validCreateProductResponse().getPlain()
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
      expect(response.statusCode).to.equal(404)
    })
    it('should render error page', () => {
      expect($('.page-title').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('Sorry, we are unable to process your request')
    })
  })
})
