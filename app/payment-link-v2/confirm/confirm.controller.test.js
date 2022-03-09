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

  const controller = proxyquire('./confirm.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie
  })

  const service = new Service(serviceFixtures.validServiceResponse())

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    mockCookie.setSessionVariable.reset()
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
})
