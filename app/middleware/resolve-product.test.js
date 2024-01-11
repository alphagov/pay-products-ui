'use strict'

// NPM Dependencies
const nock = require('nock')
const sinon = require('sinon')
const { expect } = require('chai')
const lodash = require('lodash')

// Local Dependencies
const config = require('../../config')
const Product = require('../models/Product.class')
const productFixtures = require('../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../test/fixtures/service.fixtures')
const resolveProduct = require('./resolve-product')

describe('resolve product middleware', () => {
  describe('when the product exists', () => {
    let req, res, next, product, service

    before(done => {
      product = productFixtures.validProductResponse()
      service = serviceFixtures.validServiceResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      nock(config.ADMINUSERS_URL).get(`/v1/api/services?gatewayAccountId=${product.gateway_account_id}`).reply(200, service)
      req = {}
      res = {
        locals: {},
        status: sinon.spy(),
        setHeader: sinon.spy(),
        render: sinon.spy(() => done(new Error('Resolve product middleware unexpectedly rendered a page')))
      }
      lodash.set(req, 'params.productExternalId', product.external_id)
      next = sinon.spy(err => done(err))
      resolveProduct(req, res, next)
    })

    after(() => {
      nock.cleanAll()
    })

    it('should set \'req.product\' equal to the returned Product', () => {
      expect(req).to.have.property('product').to.deep.equal(new Product(product))
    })

    it('it should call \'next\' with no arguments', () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when the product doesn\'t exist', () => {
    let req, res, next, product

    before(done => {
      product = productFixtures.validProductResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(404)
      req = {}
      res = {
        status: sinon.spy(),
        setHeader: sinon.spy(),
        render: sinon.spy(),
        redirect: sinon.spy(() => done())
      }
      lodash.set(req, 'params.productExternalId', product.external_id)
      next = sinon.spy(err => done(err))
      resolveProduct(req, res, next)
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return a redirect to the user', () => {
      sinon.assert.calledWith(res.redirect, 'https://www.gov.uk/404')
    })

    it('it should not call \'next\'', () => {
      expect(next.called).to.equal(false)
    })
  })

  describe('when some other error occurs while attempting to retrieve the product', () => {
    let req, res, next, product

    before(done => {
      product = productFixtures.validProductResponse()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).replyWithError(new Error('Some bad stuff happened'))
      req = {}
      res = {
        status: sinon.spy(),
        setHeader: sinon.spy(),
        render: sinon.spy(() => done())
      }
      lodash.set(req, 'params.productExternalId', product.external_id)
      next = sinon.spy(err => done(err))
      resolveProduct(req, res, next)
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return the http code received to the user', () => {
      expect(res.status.lastCall.args[0]).to.equal(500)
    })

    it('should render the error view', () => {
      expect(res.render.lastCall.args[0]).to.equal('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').to.equal('error.internal')
    })

    it('it should not call \'next\'', () => {
      expect(next.called).to.equal(false)
    })
  })
})
