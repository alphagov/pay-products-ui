'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const {getApp} = require('../../../../server')
const {createAppWithSession} = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let payment, product, response, $

describe('product reference post controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('when reference is unique and can be used', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      const newReference = 'I_AM_NEW'
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${product.gateway_account_id}/${newReference}`).reply(404)

      supertest(createAppWithSession(getApp()))
        .post(paths.pay.reference.replace(':productExternalId', product.external_id))
        .send({
          'payment-reference': newReference,
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code: 200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should navigate to adhoc payment start page after form submission', () => {
      expect($('form').attr('action')).to.equal(`/pay/${product.external_id}`)
    })

    it('should hide the title and description on payment amount page', () => {
      expect($('h1.heading-large').text()).to.equal('')
      expect($('p#description').text()).to.equal('')
    })
  })

  describe('when reference exists already', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label',
        reference_hint: 'Test reference hint'
      }).getPlain()
      const referenceNumber = 'I_EXIST'
      payment = productFixtures.validCreatePaymentResponse({
        reference_number: referenceNumber
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${product.gateway_account_id}/${referenceNumber}`).reply(200, payment)
      supertest(createAppWithSession(getApp()))
        .post(paths.pay.reference.replace(':productExternalId', product.external_id))
        .send({
          'payment-reference': referenceNumber,
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code: 200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render product reference start page with error message', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('h1.heading-large').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.generic-error').text()).to.include(`The Test reference label is not valid`)
    })
  })

  describe('when missing reference field', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      supertest(createAppWithSession(getApp()))
        .post(paths.pay.reference.replace(':productExternalId', product.external_id))
        .send({
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code: 200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render product reference start page with error message', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('h1.heading-large').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.generic-error').text()).to.include(`Enter a Test reference label`)
    })
  })

  describe('when reference field exceeds max length 255', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

      const referenceNumber = 'This_is_a_256_characters_long_String_This_is_a_256_characters_long_String_This_is_a_256_characters_long_String_This_is_a_256_characters_long_String_This_is_a_256_characters_long_String_This_is_a_256_characters_long_String_This_is_a_256_characters_long_Stri'
      supertest(createAppWithSession(getApp()))
        .post(paths.pay.reference.replace(':productExternalId', product.external_id))
        .send({
          'payment-reference': referenceNumber,
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code: 200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render product reference start page with error message', () => {
      expect($('title').text()).to.include(product.service_name)
      expect($('h1.heading-large').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.generic-error').text()).to.include(`The Test reference label is not valid`)
    })
  })

  describe('when backend returns other then 404', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: 'true',
        reference_label: 'Test reference label'
      }).getPlain()
      const newReference = 'I_AM_NEW'
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${product.gateway_account_id}/${newReference}`).reply(418)

      supertest(createAppWithSession(getApp()))
        .post(paths.pay.reference.replace(':productExternalId', product.external_id))
        .send({
          'payment-reference': newReference,
          csrfToken: csrf().create('123')
        })
        .end((err, res) => {
          response = res
          $ = cheerio.load(res.text || '')
          done(err)
        })
    })

    it('should respond with code: 418', () => {
      expect(response.statusCode).to.equal(418)
    })

    it('should render adhoc payment start page', () => {
      expect($('title').text()).to.include('An error occurred - GOV.UK Pay')
      expect($('#errorMsg').text()).to.include('Sorry, we are unable to process your request')
    })
  })
})
