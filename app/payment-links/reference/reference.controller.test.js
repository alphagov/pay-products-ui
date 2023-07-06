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

const textThatIs255CharactersLong = 'This text contains exactly 255 characters and this is the precise maximum number '
  + 'allowed for a payment reference and therefore it should pass the validation that checks the text is at most 255 '
  + 'characters in length and not a single character more than that'

const textThatIs256CharactersLong = 'This is a piece of text that contains exactly 256 characters and this is 1 higher '
  + 'than 255 characters and as such it will fail any validation that checks if the text has a length of 255 '
  + 'characters or fewer because it is exactly 1 character longer than that'

let req, res

describe('Reference Page Controller', () => {
  const mockPaymentLinkSession = {
    getReference: sinon.stub(),
    getAmount: sinon.stub(),
    setReference: sinon.stub(),
    setError: sinon.stub(),
    getError: sinon.stub()
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

      it('when the change query parameter is present, should set the back link to the CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          service,
          query: {
            change: 'true'
          }
        }
        res = {}

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')
        expect(pageData.reference).to.equal('reference test value')
      })

      it('should include error in the response and clear error if found in session', () => {
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
        mockPaymentLinkSession.getError.withArgs(req, product.externalId).returns('fieldValidation.potentialPANInReference')
        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('4242')
        res.locals.__p.withArgs('fieldValidation.potentialPANInReference').returns('error message')

        controller.getPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setError, req, product.externalId, '')
        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference', {
          productExternalId: 'an-external-id',
          productName: 'A Product Name',
          paymentReferenceLabel: undefined,
          paymentReferenceHint: undefined,
          backLinkHref: '/pay/an-external-id',
          reference: '4242',
          errors: { 'payment-reference': 'Error message' }
        })
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
            'payment-reference': textThatIs255CharactersLong
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, textThatIs255CharactersLong)
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/amount')
      })

      it('when an valid reference is entered and the change query param is present, should redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': textThatIs255CharactersLong
          },
          query: {
            change: 'true'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, textThatIs255CharactersLong)
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })

      it('when an valid reference is entered and the amount was provided by query parameters, should redirect to the confirm page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': textThatIs255CharactersLong
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

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, textThatIs255CharactersLong)
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

      it('when reference is a potential card number and there is the `change` query parameter, it should  ' +
        'redirect to the REFERENCE CONFIRM page with the `change` query parameter', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': '4242424242424242'
          },
          query: {
            change: 'true'
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, '4242424242424242')
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/reference/confirm?change=true')
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

        res.locals.__p.withArgs('paymentLinks.fieldValidation.enterAReference').returns('Enter your %s')

        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')

        expect(pageData.errors['payment-reference']).to.equal('Enter your invoice number')
      })

      it('when a reference > 255 is entered, it should display an error message with the `reference_label` and the back link correctly', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': textThatIs256CharactersLong
          }
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }

        res.locals.__p.withArgs('paymentLinks.fieldValidation.referenceTooLong').returns('%s must be less than or equal to 255 characters')

        controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference/reference')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.backLinkHref).to.equal('/pay/an-external-id')

        expect(pageData.errors['payment-reference']).to.equal('Invoice number must be less than or equal to 255 characters')
      })

      it('when an invalid reference is entered and the change query parameter is present, it should display an error ' +
        'message and set the back link to the CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'payment-reference': 'reference with invalid characters <>'
          },
          query: {
            change: 'true'
          }
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }

        res.locals.__p.withArgs('paymentLinks.fieldValidation.referenceCantUseInvalidChars').returns('%s can’t contain any of the following characters < > ; : ` ( ) " \' = &#124; "," ~ [ ]')

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
            'payment-reference': textThatIs255CharactersLong
          }
        }

        res = {
          redirect: sinon.spy()
        }

        controller.postPage(req, res)

        sinon.assert.calledWith(mockPaymentLinkSession.setReference, req, product.externalId, textThatIs255CharactersLong)
        sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
      })
    })
  })
})
