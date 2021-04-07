'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const csrf = require('csrf')
const supertest = require('supertest')
const { getApp } = require('../../../../server')
const { createAppWithSession } = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const serviceFixtures = require('../../../fixtures/service_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, response, service, $

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
      service = serviceFixtures.validServiceResponse().getPlain()
      const newReference = 'I_AM_NEW'
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.PRODUCTS_URL).get(`/v1/api/payments/${product.gateway_account_id}/${newReference}`).reply(404)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

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

  describe('when missing reference field', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      service = serviceFixtures.validServiceResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

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
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.govuk-heading-m').text()).to.include('Enter a valid Test reference label')
    })
  })

  describe('when reference field is only white space', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      service = serviceFixtures.validServiceResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

      supertest(createAppWithSession(getApp()))
        .post(paths.pay.reference.replace(':productExternalId', product.external_id))
        .send({
          'payment-reference': "     ",
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
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.govuk-heading-m').text()).to.include('Enter a valid Test reference label')
    })
  })

  describe('when reference field exceeds max length', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      service = serviceFixtures.validServiceResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

      const referenceNumber = 'This_is_a_51_characters_long_String_This_is_a_51_ch'
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
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.govuk-heading-m').text()).to.include('Text is too long')
    })
  })

  describe('when reference field contains disallowed characters', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label'
      }).getPlain()
      service = serviceFixtures.validServiceResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

      const referenceNumber = '<>'
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
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
      expect($('.govuk-heading-m').text()).to.include('You can’t use any of the following characters')
    })
  })
})
