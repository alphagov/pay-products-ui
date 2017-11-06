'use strict'

// NPM Dependencies
const nock = require('nock')
const sinon = require('sinon')
const {expect} = require('chai')
const lodash = require('lodash')

// Local Dependencies
const config = require('../../../config')
const Product = require('../../../app/models/Product.class')
const productFixtures = require('../../fixtures/product_fixtures')
const resolveProduct = require('../../../app/middleware/resolve_product')

describe('resolve product middleware', () => {
  describe('when the product exists', () => {
    let req, res, next, product

    before(done => {
      product = productFixtures.validCreateProductResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)
      req = {}
      res = {
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

    it(`should set 'req.product' equal to the returned Product`, () => {
      expect(req).to.have.property('product').to.deep.equal(new Product(product))
    })

    it(`it should call 'next' with no arguments`, () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when the product doesn\'t exist', () => {
    let req, res, next, product

    before(done => {
      product = productFixtures.validCreateProductResponse().getPlain()
      nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(404)
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

    it(`should return error 404 to the user`, () => {
      expect(res.status.lastCall.args[0]).to.equal(404)
    })

    it(`should render the error view`, () => {
      expect(res.render.lastCall.args[0]).to.equal('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').to.equal('Sorry, we are unable to process your request')
    })

    it(`it should not call 'next'`, () => {
      expect(next.called).to.equal(false)
    })
  })

  describe('when some other error occurs while attempting to retrieve the product', () => {
    let req, res, next, product

    before(done => {
      product = productFixtures.validCreateProductResponse().getPlain()
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

    it(`should return the http code received to the user`, () => {
      expect(res.status.lastCall.args[0]).to.equal(500)
    })

    it(`should render the error view`, () => {
      expect(res.render.lastCall.args[0]).to.equal('error')
      expect(res.render.lastCall.args[1]).to.have.property('message').to.equal('Sorry, we are unable to process your request')
    })

    it(`it should not call 'next'`, () => {
      expect(next.called).to.equal(false)
    })
  })
})
