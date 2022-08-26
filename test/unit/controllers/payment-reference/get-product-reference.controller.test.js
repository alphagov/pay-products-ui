'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const { getApp } = require('../../../../server')
const { createAppWithSession } = require('../../../test-helpers/mock-session')
const productFixtures = require('../../../fixtures/product.fixtures')
const serviceFixtures = require('../../../fixtures/service.fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, service, response, $

describe('product reference index controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('with reference enabled and label and hint', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description',
        reference_enabled: true,
        reference_label: 'Test reference label',
        reference_hint: 'Test reference hint'
      })
      service = serviceFixtures.validServiceResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

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
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-header__content').text()).to.include(product.name)
      expect($('h1').text()).to.include(product.name)
      expect($('p').text()).to.include(product.description)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/reference`)
      expect($('.govuk-button').text()).to.include('Continue')
    })
  })

  describe('with reference enabled and label and NO hint', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description',
        reference_enabled: true,
        reference_label: 'Test reference label'
      })
      service = serviceFixtures.validServiceResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

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
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-header__content').text()).to.include(product.name)
      expect($('p').text()).to.include(product.description)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/reference`)
      expect($('#hint').text().trim()).to.equal('')
    })
  })

  describe('with reference enabled and reference set in session', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description',
        reference_enabled: true,
        reference_label: 'Test reference label'
      })
      service = serviceFixtures.validServiceResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

      supertest(createAppWithSession(getApp(), { referenceNumber: 'Test reference' }))
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

    it('should render product reference start page with reference pre-populated', () => {
      expect($('.govuk-caption-l').text()).to.include(service.service_name.en)
      expect($('.govuk-button').text()).to.include('Continue')
      expect($('h1').text()).to.include(product.name)
      expect($('p').text()).to.include(product.description)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/reference`)
      expect($('#payment-reference-hint').text().trim()).to.equal('')
    })
  })

  describe('with Welsh language when there is a Welsh service name', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label',
        reference_hint: 'Test reference hint',
        language: 'cy'
      })
      service = serviceFixtures.validServiceResponse({
        service_name: {
          en: 'English service',
          cy: 'gwasanaeth Cymraeg'
        }
      })
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

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

    it('should render product reference start page with Welsh text and the Welsh service name', () => {
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-caption-l').text()).to.include(service.service_name.cy)
      expect($('.govuk-button').text()).to.include('Parhau')
    })
  })

  describe('with Welsh language when there is not a Welsh service name', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'Test reference label',
        reference_hint: 'Test reference hint',
        language: 'cy'
      })
      service = serviceFixtures.validServiceResponse({
        service_name: {
          en: 'English service'
        }
      })
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)

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

    it('should render product reference start page with Welsh text and the English service name', () => {
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-caption-l').text()).to.include(service.service_name.en)
      expect($('.govuk-button').text()).to.include('Parhau')
    })
  })
})
