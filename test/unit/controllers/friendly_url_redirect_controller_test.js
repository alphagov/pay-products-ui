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
let product, response, $
describe('friendly url redirect controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe(`when the friendly URL can be resolved to a product`, () => {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        service_name_path: 'service-name-path',
        product_name_path: 'product-name-path'
      }).getPlain()
      nock(config.PRODUCTS_URL)
        .get(`/v1/api/products`)
        .query({'serviceNamePath': product.service_name_path, 'productNamePath': product.product_name_path})
        .reply(200, product)

      supertest(createAppWithSession(getApp()))
        .get(paths.friendlyUrl.redirect
          .replace(':serviceNamePath', product.service_name_path)
          .replace(':productNamePath', product.product_name_path))
        .end((err, res) => {
          response = res
          done(err)
        })
    })
    it('should redirect with code: 302', () => {
      expect(response.statusCode).to.equal(302)
    })
    it('should redirect to friendly URL', () => {
      expect(response.header).property('location').to.equal(product._links.find(link => link.rel === 'pay').href)
    })
  })

  describe(`when the friendly URL can not be resolved to a product`, () => {
    const serviceNamePath = 'unknown-service-name-path'
    const productNamePath = 'unknown-product-name-path'
    before(done => {
      nock(config.PRODUCTS_URL)
        .get(`/v1/api/products`)
        .query({'serviceNamePath': serviceNamePath, 'productNamePath': productNamePath})
        .reply(404)

      supertest(createAppWithSession(getApp()))
        .get(paths.friendlyUrl.redirect
          .replace(':serviceNamePath', serviceNamePath)
          .replace(':productNamePath', productNamePath))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })
    it('should respond with code of 404', () => {
      expect(response.statusCode).to.equal(404)
    })
    it('should render error page', () => {
      expect($('.page-title').text()).to.equal('An error occurred:')
      expect($('#errorMsg').text()).to.equal('We are unable to process your request at this time')
    })
  })
})
