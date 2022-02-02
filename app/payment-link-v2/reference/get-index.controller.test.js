'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const productFixtures = require('../../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const Service = require('../../models/Service.class')
const responseSpy = sinon.spy()
const { NotFoundError } = require('../../errors')
const Product = require('../../models/Product.class')

const mockResponses = {
  response: responseSpy
}

let req, res

describe('Reference Page - GET controller', () => {
  const mockCookie = {
    getSessionVariable: sinon.stub()
  }

  const controller = proxyquire('./get-index.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie
  })

  const service = new Service(serviceFixtures.validServiceResponse().getPlain())

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    responseSpy.resetHistory()
  })

  describe('when product.reference_enabled=true', () => {
    const product = new Product(productFixtures.validCreateProductResponse({
      type: 'ADHOC',
      reference_enabled: true,
      price: null
    }).getPlain())

    it('when the reference is NOT in the session, then it should display the reference page ' +
      'and set the back link to the PRODUCT page', () => {
      mockCookie.getSessionVariable.withArgs(req, 'referenceNumber').returns(null)

      req = {
        correlationId: '123',
        product,
        service
      }
      res = {}
      controller(req, res)

      sinon.assert.called(responseSpy)
      sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

      const pageData = mockResponses.response.args[0][3]
      expect(pageData.backLinkHref).to.equal('/pay/an-external-id')
    })

    it('when the reference is in the session, then it should display the reference page ' +
      'and set the back link to the CONFIRM page', () => {
      mockCookie.getSessionVariable.returns('refrence test value')

      req = {
        correlationId: '123',
        product,
        service
      }
      res = {}
      controller(req, res)

      sinon.assert.called(responseSpy)
      sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

      const pageData = mockResponses.response.args[0][3]
      expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
      expect(pageData.referenceNumber).to.equal('refrence test value')
    })
  })

  describe('when there is already an reference in the product', () => {
    const product = new Product(productFixtures.validCreateProductResponse({
      type: 'ADHOC',
      reference_enabled: false,
      price: 1000
    }).getPlain())

    it('then it should display an 404 page', () => {
      req = {
        correlationId: '123',
        product,
        service
      }
      res = {}
      const next = sinon.spy()
      controller(req, res, next)

      const expectedError = sinon.match.instanceOf(NotFoundError)
        .and(sinon.match.has('message', 'Attempted to access reference page with a product that auto-generates references.'))

      sinon.assert.calledWith(next, expectedError)
    })
  })
})
