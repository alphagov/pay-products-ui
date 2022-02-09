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

describe('Amount Page Controller', () => {
  const mockCookie = {
    getSessionVariable: sinon.stub(),
    setSessionVariable: sinon.stub()
  }

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    mockCookie.setSessionVariable.reset()
    responseSpy.resetHistory()
  })

  const controller = proxyquire('./amount.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie
  })

  describe('getPage', () => {
    const service = new Service(serviceFixtures.validServiceResponse())

    beforeEach(() => {
      mockCookie.getSessionVariable.reset()
      responseSpy.resetHistory()
    })

    describe('when product.reference_enabled=true', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: null
      }))

      it('when the amount is NOT in the session, then it should display the amount page', () => {
        mockCookie.getSessionVariable.withArgs(req, 'amount').returns(null)

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/reference')
      })

      it('when the amount is in the session, then it should display that amount to 2 decimal points' +
        'and set the back link to the CONFIRM page', () => {
        mockCookie.getSessionVariable.returns(1000)

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
        expect(pageData.productAmount).to.equal('10.00')
      })
    })

    describe('when product.reference_enabled=false', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: null
      }))

      it('when the amount is NOT in the session, then it should display the amount page', () => {
        mockCookie.getSessionVariable.withArgs(req, 'amount').onFirstCall().returns(null)

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')
      })

      it('when the amount is in the session, then it should display that amount to 2 decimal points' +
        'and set the back link to the CONFIRM page', () => {
        mockCookie.getSessionVariable.returns(1000)

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
        expect(pageData.productAmount).to.equal('10.00')
      })
    })

    describe('when there is already an amount in the product', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: 1000
      }))

      it('then it should display an 404 page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        const next = sinon.spy()
        controller.getPage(req, res, next)

        const expectedError = sinon.match.instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Attempted to access amount page with a product that already has a price.'))
        sinon.assert.calledWith(next, expectedError)
      })
    })
  })

  describe('postPage', () => {
    const product = new Product(productFixtures.validProductResponse({
      type: 'ADHOC',
      reference_enabled: true,
      price: null
    }))

    it('when a valid amount is entered, it should save the amount to the session and ' +
      'redirect to the confirm page', () => {
      req = {
        correlationId: '123',
        product,
        body: {
          'payment-amount': '1000'
        }
      }

      res = {
        redirect: sinon.spy()
      }

      controller.postPage(req, res)

      sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'paymentAmount', '1000')
      sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
    })

    it('when an empty amount is entered, it should display an error message and the back link correctly', () => {
      req = {
        correlationId: '123',
        product,
        body: {
          'payment-amount': ''
        }
      }

      res = {
        redirect: sinon.spy(),
        locals: {
          __p: sinon.spy()
        }
      }

      controller.postPage(req, res)

      sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

      const pageData = mockResponses.response.args[0][3]
      expect(pageData.backLinkHref).to.equal('/pay/an-external-id/reference')

      sinon.assert.calledWith(res.locals.__p, 'paymentLinksV2.fieldValidation.enterAnAmountInPounds')
    })

    it('when an invalid amount is entered and an amount is already saved to the session, it should display an error' +
    'message and set the back link to the CONFIRM page', () => {
      mockCookie.getSessionVariable.returns(1000)

      req = {
        correlationId: '123',
        product,
        body: {
          'payment-amount': 'invalid amount'
        }
      }

      res = {
        redirect: sinon.spy(),
        locals: {
          __p: sinon.spy()
        }
      }

      controller.postPage(req, res)

      sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

      const pageData = mockResponses.response.args[0][3]
      expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')

      sinon.assert.calledWith(res.locals.__p, 'paymentLinksV2.fieldValidation.enterAnAmountInTheCorrectFormat')
    })
  })
})
