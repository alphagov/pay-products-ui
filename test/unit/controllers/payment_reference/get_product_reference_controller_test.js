'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const {getApp} = require('../../../../server')
const {createAppWithSession} = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, response, $

describe('product reference index controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('with reference enabled and label and hint', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description',
        reference_enabled: true,
        reference_label: 'Test reference label',
        reference_hint: 'Test reference hint'
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .get(paths.pay.reference.replace(':productExternalId', product.external_id))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render product reference start page with all fields', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('h1.heading-large').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('#payment-reference-label').text()).to.include('Test reference label')
      expect($('#payment-reference-hint').text()).to.include('Test reference hint')
    })
  })

  describe('with reference enabled and label and NO hint', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .get(paths.pay.reference.replace(':productExternalId', product.external_id))
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render product reference start page with all fields', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('h1.heading-large').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('#payment-reference-label').text()).to.include('Test reference label')
      expect($('#payment-reference-hint').text()).to.equal('')
    })
  })
})
