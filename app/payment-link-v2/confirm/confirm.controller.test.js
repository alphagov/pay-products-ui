'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const productFixtures = require('../../../test/fixtures/product.fixtures')
const serviceFixtures = require('../../../test/fixtures/service.fixtures')
const Service = require('../../models/Service.class')
const responseSpy = sinon.spy()
const Product = require('../../models/Product.class')
const { NotFoundError } = require('../../errors')

const mockResponses = {
  response: responseSpy
}

let req, res

describe('Confirm Page Controller', () => {
  const mockCookie = {
    getSessionVariable: sinon.stub(),
    setSessionVariable: sinon.stub()
  }

  const mockCaptcha = {
    verifyCAPTCHAToken: sinon.stub()
  }

  const controller = proxyquire('./confirm.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie,
    '../../utils/captcha': mockCaptcha
  })

  const service = new Service(serviceFixtures.validServiceResponse())

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    mockCookie.setSessionVariable.reset()
    responseSpy.resetHistory()
    mockCaptcha.verifyCAPTCHAToken.reset()
  })

  describe('getPage', () => {
    describe('when product.reference_enabled=true and product.price=null', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: null
      }))

      it('when the reference & amount is in the session, then it should display the confirm page ' +
        'and update the page data with the reference value and amount', () => {
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

        mockCookie.getSessionVariable.withArgs(req, 'referenceNumber').returns('test invoice number')
        mockCookie.getSessionVariable.withArgs(req, 'amount').returns('10.50')

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.summaryElements.length).to.equal(2)

        expect(pageData.summaryElements[0].summaryLabel).to.equal('invoice number')
        expect(pageData.summaryElements[0].summaryValue).to.equal('test invoice number')

        expect(pageData.summaryElements[1].summaryLabel).to.equal('Total to pay')
        expect(pageData.summaryElements[1].summaryValue).to.equal('£10.50')
      })

      it('when the amount is in the session, then it should display the confirm page ' +
        'and update the page data with the amount only', () => {
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

        mockCookie.getSessionVariable.withArgs(req, 'amount').returns('10.50')

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.summaryElements.length).to.equal(1)
        expect(pageData.summaryElements[0].summaryLabel).to.equal('Total to pay')
        expect(pageData.summaryElements[0].summaryValue).to.equal('£10.50')
      })

      it('when there is no amount in the session, then it should display a 404 page', () => {
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

        mockCookie.getSessionVariable.withArgs(req, 'amount').returns(null)

        const next = sinon.spy()
        controller.getPage(req, res, next)

        const expectedError = sinon.match.instanceOf(NotFoundError)
          .and(sinon.match.has('message', 'Attempted to access confirm page without a price in the session or product.'))
        sinon.assert.calledWith(next, expectedError)
      })
    })

    describe('when product.reference_enabled=false and product.price=1000', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: 1000
      }))

      it('when the amount is in the session, then it should display the confirm page ' +
        'and update the page data with the amount value', () => {
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

        mockCookie.getSessionVariable.withArgs(req, 'amount').returns('10.50')

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.summaryElements.length).to.equal(1)
        expect(pageData.summaryElements[0].summaryLabel).to.equal('Total to pay')
        expect(pageData.summaryElements[0].summaryValue).to.equal('£10.50')
      })

      it('when there is NO amount is in the session, then it should display the confirm page ' +
        'and update the page data with the product.price', () => {
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

        mockCookie.getSessionVariable.withArgs(req, 'amount').returns(null)

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.summaryElements.length).to.equal(1)
        expect(pageData.summaryElements[0].summaryLabel).to.equal('Total to pay')
        expect(pageData.summaryElements[0].summaryValue).to.equal('£10.00')
      })
    })
  })

  describe('postPage', () => {
    describe('when product.requireCaptcha=true and product.price=1000', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_label: 'Invoice number',
        reference_enabled: true,
        price: 1000,
        require_captcha: true
      }))

      it('when a failed captcha is entered, it should display an error and ' +
        'redirect to the confirm page and show the values from the hidden form fields to display ' +
        'the page so that it prevents session interference', async () => {
        req = {
          correlationId: '123',
          product,
          body: {
            'reference-value': 'a-invoice-number',
            amount: '10.00',
            'g-recaptcha-response': 'recaptcha-test-token'
          }
        }

        res = {
          locals: {
            __p: sinon.stub()
          }
        }

        mockCaptcha.verifyCAPTCHAToken.resolves(false)

        res.locals.__p.withArgs('paymentLinksV2.confirm.totalToPay').returns('Total to pay')
        res.locals.__p.withArgs('paymentLinksV2.fieldValidation.youMustSelectIAmNotARobot')
          .returns('You failed the captcha challenge.  Please try again.')

        await controller.postPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'confirm/confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.summaryElements.length).to.equal(2)
        expect(pageData.summaryElements[0].summaryLabel).to.equal('Invoice number')
        expect(pageData.summaryElements[0].summaryValue).to.equal('a-invoice-number')
        expect(pageData.summaryElements[1].summaryLabel).to.equal('Total to pay')
        expect(pageData.summaryElements[1].summaryValue).to.equal('£10.00')

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
            amount: '10.00',
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
