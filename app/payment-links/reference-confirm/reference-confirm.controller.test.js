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

describe('Reference Confirm Page Controller', () => {
  const mockPaymentLinkSession = {
    getReference: sinon.stub()
  }

  const controller = proxyquire('./reference-confirm.controller', {
    '../../utils/response': mockResponses,
    '../utils/payment-link-session': mockPaymentLinkSession
  })

  const service = new Service(serviceFixtures.validServiceResponse())

  beforeEach(() => {
    mockPaymentLinkSession.getReference.reset()
    responseSpy.resetHistory()
  })

  describe('getPage', () => {
    describe('when product.reference_enabled=true and product.price=null', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: null
      }))

      it('when the reference is in the session, then it should display the REFERENCE CONFIRM page ' +
        'and set the `back` link to the REFERENCE page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')
        res.locals.__p.withArgs('paymentLinks.referenceConfirm.confirmYourReference').returns('Confirm your %s')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.reference).to.equal('reference test value')
      })

      it('when the reference is in the session, then it should display the REFERENCE CONFIRM page ' +
        'and set the heading correctly to include the reference label', () => {
        req = {
          correlationId: '123',
          product,
          service
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')
        res.locals.__p.withArgs('paymentLinks.referenceConfirm.confirmYourReference').returns('Confirm your %s')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.heading).to.equal('Confirm your invoice number')
      })

      it('when there is NO reference is in the session, then it should display the 404 page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns(null)

        const next = sinon.spy()
        controller.getPage(req, res, next)

        const expectedError = sinon.match.instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Attempted to access reference confirm page without a reference in the session.'))

        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('when product.reference_enabled=true and product.price=1000 ', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: 1000
      }))

      it('when the reference is in the session, then it should display the REFERENCE CONFIRM page ' +
        'and set the `back` link to the REFERENCE page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')
        res.locals.__p.withArgs('paymentLinks.referenceConfirm.confirmYourReference').returns('Confirm your %s')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
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

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        const next = sinon.spy()
        controller.getPage(req, res, next)

        const expectedError = sinon.match.instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Attempted to access reference confirm page with a product that auto-generates references.'))

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

      it('when the user confirms the reference then it should redirect to the amount page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': 'yes'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/amount')
      })

      it('when the user does NOT confirm the reference then it should redirect to the reference page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': 'no'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference')
      })

      it('when the user does NOT select an option then it should show an error', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': undefined
          }
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        res.locals.__p.withArgs('paymentLinks.referenceConfirm.selectYesIfYourReferenceIsCorrect').returns('Select yes if your %s is correct')

        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/reference')

        expect(pageData.errors['confirm-reference']).to.equal('Select yes if your invoice number is correct')
      })

      it('when change query parameter is present and user select `yes`, it should redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': 'yes'
          },
          query: {
            change: 'true'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })

      it('when amount was provided by query parameters and the user selects `yes`, should redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': 'yes'
          },
          session: {}
        }

        req.session[product.externalId] = {
          amount: 1000,
          amountProvidedByQueryParams: true
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })
    })

    describe('when the product has a price', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: 1000
      }))

      it('when the user confirms the reference then it should redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': 'yes'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })

      it('when the user does NOT confirm the reference then it should redirect to the reference page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'confirm-reference': 'no'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference')
      })
    })
  })
})
