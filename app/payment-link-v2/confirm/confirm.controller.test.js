'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const productFixtures = require('../../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const Service = require('../../models/Service.class')
const responseSpy = sinon.spy()
const Product = require('../../models/Product.class')

const mockResponses = {
  response: responseSpy
}

let req, res

describe('Confirm Page Controller', () => {
  const mockPaymentLinkSession = {
    getAmount: sinon.stub(),
    getReference: sinon.stub(),
    deletePaymentLinkSession: sinon.stub()
  }

  const mockCaptcha = {
    verifyCAPTCHAToken: sinon.stub()
  }

  const mockProductsClient = {
    payment: {
      create: sinon.stub()
    }
  }

  const controller = proxyquire('./confirm.controller', {
    '../../utils/response': mockResponses,
    '../utils/payment-link-session': mockPaymentLinkSession,
    '../../utils/captcha': mockCaptcha,
    '../../services/clients/products.client': mockProductsClient
  })

  const service = new Service(serviceFixtures.validServiceResponse())

  beforeEach(() => {
    mockPaymentLinkSession.getAmount.reset()
    mockPaymentLinkSession.getReference.reset()
    responseSpy.resetHistory()
    mockCaptcha.verifyCAPTCHAToken.reset()
    mockProductsClient.payment.create.reset()
  })

  describe('getPage', () => {
    describe('when product.reference_enabled=true and product.price=null', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: null
      }))

      it('then it should update the page data and display the confirm page', () => {
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

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('test invoice number')
        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(1050)

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]

        expect(pageData.productReferenceLabel).to.equal('invoice number')
        expect(pageData.sessionReferenceNumber).to.equal('test invoice number')
        expect(pageData.sessionAmount).to.equal(1050)
        expect(pageData.amountAsPence).to.equal(1050)
        expect(pageData.amountAsGbp).to.equal('£10.50')
        expect(pageData.referenceChangeUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.amountChangeUrl).to.equal('/pay/an-external-id/amount')
      })

      it('when there is no amount in the session, then it should redirect to the start page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {
          redirect: sinon.stub(),
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(null)

        const next = sinon.spy()
        controller.getPage(req, res, next)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id')
      })

      it('when there is an amount in the session and there is no reference in the session, ' +
      'then it should redirect to the start page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {
          redirect: sinon.stub(),
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(1000)
        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns(null)

        const next = sinon.spy()
        controller.getPage(req, res, next)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id')
      })
    })

    describe('when product.reference_enabled=true and product.price=1000', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: 1000
      }))

      it('when there is a reference in a session, then it should update the page data with the `product.price` and display ' +
      'the confirm page', () => {
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

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('test invoice number')

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]

        expect(pageData.productReferenceLabel).to.equal('invoice number')
        expect(pageData.sessionReferenceNumber).to.equal('test invoice number')
        expect(pageData.sessionAmount).to.equal(undefined)
        expect(pageData.amountAsPence).to.equal(1000)
        expect(pageData.amountAsGbp).to.equal('£10.00')
        expect(pageData.referenceChangeUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.amountChangeUrl).to.equal('/pay/an-external-id/amount')
      })

      it('when there is no reference in the session then it should redirect to the start page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {
          redirect: sinon.stub(),
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns(null)

        const next = sinon.spy()
        controller.getPage(req, res, next)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id')
      })
    })

    describe('when product.reference_enabled=false and product.price=null', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: null
      }))

      it('then it should update the page data so there is NO reference and display ' +
        'the confirm page', () => {
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

        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns('1050')

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]

        expect(pageData.productReferenceLabel).to.equal(undefined)
        expect(pageData.sessionReferenceNumber).to.equal(undefined)
        expect(pageData.sessionAmount).to.equal('1050')
        expect(pageData.amountAsPence).to.equal('1050')
        expect(pageData.amountAsGbp).to.equal('£10.50')
        expect(pageData.referenceChangeUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.amountChangeUrl).to.equal('/pay/an-external-id/amount')
      })

      it('when there is no amount in the session, then it should redirect to the start page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }
        res = {
          redirect: sinon.stub(),
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getAmount.withArgs(req, product.externalId).returns(null)

        const next = sinon.spy()
        controller.getPage(req, res, next)

        sinon.assert.calledWith(res.redirect, '/pay/an-external-id')
      })
    })
  })

  describe('postPage', () => {
    describe('when product.requireCaptcha=false, reference_enabled=false, product.price=null, ', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: null
      }))

      it('when `click and continue` is clicked, should create a payment with no reference and ' +
        'ignore the hidden reference form field and ' +
        'use the amount from the hidden amount form field and ' +
        'redirect to the next_url ', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '2000'
          }
        }

        res = {
          redirect: sinon.stub()
        }

        mockProductsClient.payment.create.resolves({
          links: {
            next: {
              href: 'https://test.com'
            }
          }
        })

        await controller.postPage(req, res)

        sinon.assert.calledWith(
          mockProductsClient.payment.create,
          'an-external-id',
          2000,
          null
        )
        sinon.assert.calledWith(mockPaymentLinkSession.deletePaymentLinkSession, req, product.externalId)
        sinon.assert.calledWith(res.redirect, 303, 'https://test.com')
      })

      it('when creating a payment and an error occurs, should call next() with an error', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '1000'
          }
        }

        res = {
          redirect: sinon.stub()
        }

        const next = sinon.stub()

        mockProductsClient.payment.create.rejects(new Error('Failed to create payment.'))

        await controller.postPage(req, res, next)

        sinon.assert.calledWith(
          mockProductsClient.payment.create,
          'an-external-id',
          1000
        )

        const expectedError = sinon.match.instanceOf(Error)
          .and(sinon.match.has('message', 'Failed to create payment.'))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('when product.requireCaptcha=false, reference_enabled=true, product.price=null, ', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: null
      }))

      it('when `click and continue` is clicked, should create a payment with a reference ' +
        'using the `hidden reference form field` and ' +
        'use the amount from the `hidden amount form field` and ' +
        'redirect to the next_url ', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '2000'
          }
        }

        res = {
          redirect: sinon.stub()
        }

        mockProductsClient.payment.create.resolves({
          links: {
            next: {
              href: 'https://test.com'
            }
          }
        })

        await controller.postPage(req, res)

        sinon.assert.calledWith(
          mockProductsClient.payment.create,
          'an-external-id',
          2000,
          'a-invoice-number'
        )
        sinon.assert.calledWith(res.redirect, 303, 'https://test.com')
      })
    })

    describe('when product.requireCaptcha=false, reference_enabled=false, product.price=1000, ', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: false,
        price: 1000
      }))

      it('when `click and continue` is clicked, should create a payment with NO reference and ' +
        'ignore the `hidden reference form field` and ' +
        'use the product.price and ' +
        'ignore `hidden amount form field` and ' +
        'redirect to the next_url ', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '2000'
          }
        }

        res = {
          redirect: sinon.stub()
        }

        mockProductsClient.payment.create.resolves({
          links: {
            next: {
              href: 'https://test.com'
            }
          }
        })

        await controller.postPage(req, res)

        sinon.assert.calledWith(
          mockProductsClient.payment.create,
          'an-external-id',
          1000
        )
        sinon.assert.calledWith(res.redirect, 303, 'https://test.com')
      })
    })

    describe('when product.requireCaptcha=false, reference_enabled=true, product.price=1000, ', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        price: 1000
      }))

      it('when `click and continue` is clicked, should create a payment with a reference and ' +
        'use the `hidden reference form field` and ' +
        'use the product.price and ' +
        'ignore `hidden amount form field` and ' +
        'redirect to the next_url', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '2000'
          }
        }

        res = {
          redirect: sinon.stub()
        }

        mockProductsClient.payment.create.resolves({
          links: {
            next: {
              href: 'https://test.com'
            }
          }
        })

        await controller.postPage(req, res)

        sinon.assert.calledWith(
          mockProductsClient.payment.create,
          'an-external-id',
          1000,
          'a-invoice-number'
        )
        sinon.assert.calledWith(res.redirect, 303, 'https://test.com')
      })
    })

    describe('when product.requireCaptcha=true, reference_enabled=true, product.price=1000', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_label: 'invoice number',
        reference_enabled: true,
        price: 1000,
        require_captcha: true
      }))

      it('when a successful captcha is entered, should redirect to the ' +
        'next_url', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '1000',
            'g-recaptcha-response': 'recaptcha-test-token'
          }
        }

        res = {
          locals: {
            __p: sinon.stub()
          },
          redirect: sinon.stub()
        }

        mockCaptcha.verifyCAPTCHAToken.withArgs('recaptcha-test-token').resolves(true)

        mockProductsClient.payment.create.resolves({
          links: {
            next: {
              href: 'https://test.com'
            }
          }
        })

        await controller.postPage(req, res)

        sinon.assert.calledWith(mockCaptcha.verifyCAPTCHAToken, 'recaptcha-test-token')

        sinon.assert.calledWith(
          mockProductsClient.payment.create,
          'an-external-id',
          1000,
          'a-invoice-number'
        )
        sinon.assert.calledWith(res.redirect, 303, 'https://test.com')
      })

      it('when a failed captcha is entered, it should display an error and ' +
        'redirect to the confirm page and show the values from the hidden form fields to display ' +
        'the page so that it prevents session interference', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '2000',
            'g-recaptcha-response': 'recaptcha-test-token'
          }
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('test invoice number')

        mockCaptcha.verifyCAPTCHAToken.resolves(false)

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')
        res.locals.__p.withArgs('paymentLinksV2.fieldValidation.youMustSelectIAmNotARobot')
          .returns('You failed the captcha challenge.  Please try again.')

        await controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]

        expect(pageData.productReferenceLabel).to.equal('invoice number')
        expect(pageData.sessionReferenceNumber).to.equal('test invoice number')
        expect(pageData.sessionAmount).to.equal(undefined)
        expect(pageData.amountAsPence).to.equal(1000)
        expect(pageData.amountAsGbp).to.equal('£10.00')
        expect(pageData.referenceChangeUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.amountChangeUrl).to.equal('/pay/an-external-id/amount')

        expect(pageData.errors).to.contain({
          recaptcha: 'You failed the captcha challenge.  Please try again.'
        })
      })

      it('when the captcha call fails, it should display an error and ' +
        'redirect to the confirm page', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '1000',
            'g-recaptcha-response': 'recaptcha-test-token'
          }
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockCaptcha.verifyCAPTCHAToken.rejects()

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')
        res.locals.__p.withArgs('paymentLinksV2.fieldValidation.youMustSelectIAmNotARobot')
          .returns('There was an issue with the recaptcha.  Please try again.')

        await controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]

        expect(pageData.errors).to.contain({
          recaptcha: 'There was an issue with the recaptcha.  Please try again.'
        })
      })
    })
  })
})
