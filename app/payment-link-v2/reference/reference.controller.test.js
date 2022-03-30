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

describe('Reference Page Controller', () => {
  const mockPaymentLinkSession = {
    getReference: sinon.stub(),
    getAmount: sinon.stub(),
    setReference: sinon.stub()
  }

  const controller = proxyquire('./reference.controller', {
    '../../utils/response': mockResponses,
    '../utils/payment-link-session': mockPaymentLinkSession
  })

  const service = new Service(serviceFixtures.validServiceResponse())

  beforeEach(() => {
    mockPaymentLinkSession.getReference.reset()
    mockPaymentLinkSession.getAmount.reset()
    mockPaymentLinkSession.setReference.reset()
    responseSpy.resetHistory()
  })

  describe('getPage', () => {
    describe('when product.reference_enabled=true', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: null
      }))

      it('when the reference is NOT in the session, then it should display the reference page ' +
        'and set the back link to the PRODUCT page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}
        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns(undefined)

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')
      })

      it('when the reference is in the session, then it should display the reference page ' +
        'and set the back link to the CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {}

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
        expect(pageData.reference).to.equal('reference test value')
      })
    })

    describe('when there is already an reference in the product', () => {
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
          .and(sinon.match.has('message', 'Attempted to access reference page with a product that auto-generates references.'))

        sinon.assert.calledWith(next, expectedError)
      })
    })
  })

  describe('postPage', () => {
    describe('when the product has no price', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: null
      }))

      it('when a valid reference is entered, it should save the reference to the session and ' +
        'redirect to the amount page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'valid reference'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, 'valid reference')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/amount')
      })

      it('when an valid reference is entered and an AMOUNT is already saved to the session, it should  ' +
      'redirect to the CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'valid reference'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(1000)

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, 'valid reference')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })

      it('when reference is a potential card number, it should  ' +
      'redirect to the REFERENCE CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': '4242424242424242'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, '4242424242424242')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference/confirm')
      })

      it('when reference is a potential card number and there is an amount in the session, it should  ' +
      'redirect to the REFERENCE CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': '4242424242424242'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, '4242424242424242')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference/confirm')
      })

      it('when an empty reference is entered, it should display an error message with the `reference_label` and the back link correctly', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': ''
          }
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }

        res.locals.__p.withArgs('paymentLinksV2.fieldValidation.enterAReference').returns('Enter your %s')

        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')

        expect(pageData.errors['payment-reference']).to.equal('Enter your invoice number')
      })

      it('when a reference > 50 is entered, it should display an error message with the `reference_label` and the back link correctly', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1'
          }
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }

        res.locals.__p.withArgs('paymentLinksV2.fieldValidation.referenceMustBeLessThanOrEqual50Chars').returns('%s must be less than or equal to 50 characters')

        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')

        expect(pageData.errors['payment-reference']).to.equal('Invoice number must be less than or equal to 50 characters')
      })

      it('when an invalid reference is entered and a reference is already saved to the session, it should display an error ' +
      'message and set the back link to the CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'reference with invalid characters <>'
          }
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('a valid reference')

        res.locals.__p.withArgs('paymentLinksV2.fieldValidation.referenceCantUseInvalidChars').returns('%s can’t contain any of the following characters < > ; : ` ( ) " \' = &#124; "," ~ [ ]')

        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')

        expect(pageData.errors['payment-reference']).to.equal('Invoice number can’t contain any of the following characters < > ; : ` ( ) " \' = &#124; "," ~ [ ]')
      })
    })

    describe('when the product has a price', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: 1000
      }))

      it('when a valid reference is entered, it should save the reference to the session and ' +
        'redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'valid reference'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, 'valid reference')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })
    })
  })
})
