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
        'and set the `back` link to the REFERENCE page ' +
        'and set the  `confirm and continue` link to the AMOUNT page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }
        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.reference).to.equal('reference test value')
        expect(pageData.referencePageUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.confirmAndContinuePageUrl).to.equal('/pay/an-external-id/amount')
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
        'and set the `back` link to the REFERENCE page' +
        'and set the  `confirm and continue` link to the CONFIRM page', () => {
        req = {
          correlationId: '123',
          product,
          service
        }

        res = {
          redirect: sinon.spy(),
          locals: {
            __p: sinon.stub()
          }
        }
        mockPaymentLinkSession.getReference.withArgs(req, product.externalId).returns('reference test value')
        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.reference).to.equal('reference test value')
        expect(pageData.referencePageUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.confirmAndContinuePageUrl).to.equal('/pay/an-external-id/confirm')
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
          .and(sinon.match.has('message', 'Attempted to access reference confirm page with a product that auto-generates references.'))

        sinon.assert.calledWith(next, expectedError)
      })
    })
  })
})
