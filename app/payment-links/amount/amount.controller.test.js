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
  const mockPaymentLinkSession = {
    getAmount: sinon.stub(),
    getReference: sinon.stub(),
    setAmount: sinon.stub()
  }

  beforeEach(() => {
    mockPaymentLinkSession.getAmount.reset()
    mockPaymentLinkSession.getReference.reset()
    mockPaymentLinkSession.setAmount.reset()
    responseSpy.resetHistory()
  })

  const controller = proxyquire('./amount.controller', {
    '../../utils/response': mockResponses,
    '../utils/payment-link-session': mockPaymentLinkSession
  })

  describe('getPage', () => {
    const service = new Service(serviceFixtures.validServiceResponse())

    describe('when product.reference_enabled=true', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: null
      }))

      it('when the amount is NOT in the session, then it should display the amount page and set the ' +
        'back link to the reference page', () => {
        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(undefined)
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

      it('when the amount is in the session, then it should display that amount to 2 decimal places', () => {
        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(1050)
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.amount).to.equal('10.50')
      })

      it('when the change query parameter is present, should set the back link to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          service,
          query: {
            change: 'true'
          }
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
      })
    })

    describe('when product.reference_enabled=false', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: null
      }))

      it('when the amount is NOT in the session, then it should display the amount page', () => {
        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(undefined)
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

      it('when the amount is in the session, then it should display that amount to 2 decimal points', () => {
        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(1000)

        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.amount).to.equal('10.00')
      })

      it('when the change query parameter is present, should set the back link to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          service,
          query: {
            change: 'true'
          }
        }
        res = {}
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
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
          'payment-amount': '9.95' // deliberately picked because in IEEE 754, 9.95 * 100 is not 995
        }
      }

      res = {
        redirect: sinon.spy()
      }

      controller.postPage(req, res)

      sinon.assert.calledWith(mockPaymentLinkSession.setAmount, req, product.externalId, 995)
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

      sinon.assert.calledWith(res.locals.__p, 'paymentLinks.fieldValidation.enterAnAmountInPounds')
    })

    it('when a zero value amount is entered, it should display an error message and the back link correctly', () => {
      req = {
        correlationId: '123',
        product,
        body: {
          'payment-amount': '0.00'
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

      sinon.assert.calledWith(res.locals.__p, 'paymentLinks.fieldValidation.enterANonZeroAmountInPounds')
    })

    it('when an invalid amount is entered and the change query parameter is present, it should display an error' +
      'message and set the back link to the CONFIRM page', () => {
      req = {
        correlationId: '123',
        product,
        body: {
          'payment-amount': 'invalid amount'
        },
        query: {
          change: 'true'
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

      sinon.assert.calledWith(res.locals.__p, 'paymentLinks.fieldValidation.enterAnAmountInTheCorrectFormat')
    })
  })
})
