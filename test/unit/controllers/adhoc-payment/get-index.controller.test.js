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
let product, response, service, $

describe('adhoc payment index controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  describe('ADHOC payment starting page', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        product_name: 'Super duper product',
        description: 'Super duper product description'
      })
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'Super GOV service'
        }
      })
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
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-caption-l').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p').text()).to.include(product.description)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/amount`)
    })
  })

  describe('start page for a Welsh product', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        language: 'cy'
      })
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'English service',
          cy: 'gwasanaeth Cymraeg'
        }
      })
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
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-caption-l').text()).to.include(service.service_name.cy)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/amount`)
    })
  })

  describe('fixed amount ADHOC payment and reference disabled', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        price: 600,
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description'
      })
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'Super GOV service'
        },
        name: 'Super Duper Service'
      })
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
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-caption-l').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p').text()).to.include(product.description)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/confirm`)
    })
  })

  describe('fixed amount ADHOC payment and reference enabled', function () {
    before(done => {
      product = productFixtures.validProductResponse({
        type: 'ADHOC',
        price: 600,
        product_name: 'Super duper product',
        service_name: 'Super GOV service',
        description: 'Super duper product description',
        reference_enabled: true
      })
      service = serviceFixtures.validServiceResponse({
        gateway_account_ids: [product.gateway_account_id],
        service_name: {
          en: 'Super GOV service'
        },
        name: 'Super Duper Service'
      })
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
      expect($('title').text()).to.include(product.name)
      expect($('.govuk-caption-l').text()).to.include(service.service_name.en)
      expect($('h1').text()).to.include(product.name)
      expect($('p').text()).to.include(product.description)
      expect($('.govuk-button').attr('href')).to.equal(`/pay/${product.external_id}/reference`)
    })
  })
})
