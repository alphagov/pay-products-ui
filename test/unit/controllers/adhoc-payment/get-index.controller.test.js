'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const currencyFormatter = require('currency-formatter')
const supertest = require('supertest')
const { getApp } = require('../../../../server')
const { createAppWithSession } = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const serviceFixtures = require('../../../fixtures/service_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, response, service, $

function asGBP (amountInPence) {
  return currencyFormatter.format((amountInPence / 100).toFixed(2), { code: 'GBP' })
}

describe('adhoc payment index controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('variable amount ADHOC payment with reference disabled', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        description: 'Super duper product description'
      }).getPlain()
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'Super GOV service'
        }
      }).getPlain()
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

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render adhoc payment start page', () => {
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/${product.external_id}`)
    })

    it('should show the amount input', () => {
      expect($('.govuk-label').text()).to.include('Payment amount')
      expect($('#payment-amount').text()).to.include('')
    })
  })

  describe('enter amount page for a Welsh product', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        language: 'cy'
      }).getPlain()
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'English service',
          cy: 'gwasanaeth Cymraeg'
        }
      }).getPlain()
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

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render adhoc payment start page with Welsh translations', () => {
      expect($('title').text()).to.include(service.service_name.cy)
      expect($('.govuk-header__content').text()).to.include(service.service_name.cy)
    })

    it('should show the amount input with Welsh translations', () => {
      expect($('.govuk-label').text()).to.include('Swm y taliad')
      expect($('#payment-amount').text()).to.include('')
    })
  })

  describe('fixed amount ADHOC payment with reference disabled', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        price: 600,
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description'
      }).getPlain()
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'Super GOV service'
        },
        name: 'Super Duper Service'
      }).getPlain()
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

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render adhoc payment start page', () => {
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/${product.external_id}`)
    })

    it('should show the fixed amount', () => {
      expect($('.govuk-label').text()).to.include('Payment amount')
      expect($('#payment-amount').text()).to.include(asGBP(product.price))
    })
  })

  describe('ADHOC payment with reference enabled and no reference number set', function () {
    before(done => {
      product = productFixtures.validCreateProductResponse({
        type: 'ADHOC',
        product_name: 'Test ADHOC Product Name',
        service_name: 'Test ADHOC GOV service',
        description: 'Test ADHOC product description',
        reference_enabled: true
      }).getPlain()
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'Super GOV service'
        },
        name: 'Super Duper Service'
      }).getPlain()
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

    it('should respond with code:200 OK', () => {
      expect(response.statusCode).to.equal(200)
    })

    it('should render payment reference start page', () => {
      expect($('title').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p#description').text()).to.include(product.description)
      expect($('form').attr('action')).to.equal(`/pay/reference/${product.external_id}`)
    })
  })
})
