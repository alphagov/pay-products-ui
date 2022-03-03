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
  const mockCookie = {
    getSessionVariable: sinon.stub()
  }

  const controller = proxyquire('./reference-confirm.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie
  })

  const service = new Service(serviceFixtures.validServiceResponse())

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    responseSpy.resetHistory()
  })

  describe('getPage', () => {
    describe('when product.reference_enabled=true', () => {
      const product = new Product(productFixtures.validProductResponse({
        type: 'ADHOC',
        reference_enabled: true,
        reference_label: 'invoice number',
        price: null
      }))

      it('when the reference is in the session, then it should display the REFERENCE CONFIRM page ' +
        'and set the back link to the REFERENCE page', () => {
        mockCookie.getSessionVariable.returns('refrence test value')

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

        controller.getPage(req, res)

        sinon.assert.calledWith(responseSpy, req, res, 'reference-confirm/reference-confirm')

        const pageData = mockResponses.response.args[0][3]
        expect(pageData.reference).to.equal('refrence test value')
        expect(pageData.referencePageUrl).to.equal('/pay/an-external-id/reference')
        expect(pageData.confirmPageUrl).to.equal('/pay/an-external-id/confirm')
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
