'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')

const productFixtures = require('../../test/fixtures/product.fixtures')
const Product = require('../models/Product.class')

const mockResponse = {
  response: sinon.spy()
}

const statusSpy = sinon.spy()

const controller = proxyquire('./pre-payment.controller', {
  '../utils/response': mockResponse
})
const productExternalId = 'product-external-id'
const queryParamAmount = '10000000'
const queryParamReference = 'abcd'

function createProduct (referenceEnabled, fixedPrice) {
  return new Product(productFixtures.validProductResponse({
    type: 'ADHOC',
    external_id: productExternalId,
    reference_enabled: referenceEnabled,
    price: fixedPrice
  }))
}

describe('Pre payment controller', () => {
  beforeEach(() => {
    mockResponse.response.resetHistory()
    statusSpy.resetHistory()
  })

  describe('The product type is ADHOC', () => {
    describe('The product has reference enabled', () => {
      it('should render the start payment link page with continue to reference page', () => {
        const product = createProduct(true, 1000)
        const req = { product }
        const res = {}
        const next = {}

        controller(req, res, next)

        sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/reference` })
      })
    })
    describe('The product has reference disabled and does not have fixed price', () => {
      it('should render the start payment link page with continue to amount page', () => {
        const product = createProduct(false, null)
        const req = { product }
        const res = {}
        const next = {}

        controller(req, res, next)

        sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/amount` })
      })
    })
    describe('The product has reference disabled and fixed price', () => {
      it('should render the start payment link page with continue to confirm page', () => {
        const product = createProduct(false, 1000)
        const req = { product }
        const res = {}
        const next = {}

        controller(req, res, next)

        sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/confirm` })
      })
    })
    describe('A reference and amount are passed as query parameters', () => {
      describe('The product has reference_enabled and no price', () => {
        it('should add reference and amount to session and render the start page with continue linking to the confirm page', () => {
          const product = createProduct(true, null)
          const req = {
            product,
            query: {
              amount: queryParamAmount,
              reference: queryParamReference
            }
          }
          const res = {}
          const next = {}

          controller(req, res, next)

          expect(req).to.have.property('session')
          expect(req.session).to.have.property(product.externalId)
          expect(req.session[product.externalId]).to.deep.equal({
            reference: queryParamReference,
            amount: queryParamAmount,
            referenceProvidedByQueryParams: true,
            amountProvidedByQueryParams: true
          })

          sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/confirm` })
        })

        describe('The product has reference_enabled=false and no price', () => {
          it('should not add reference to the session', () => {
            const product = createProduct(false, null)
            const req = {
              product,
              query: {
                amount: queryParamAmount,
                reference: queryParamReference
              }
            }
            const res = {}
            const next = {}

            controller(req, res, next)

            expect(req).to.have.property('session')
            expect(req.session).to.have.property(product.externalId)
            expect(req.session[product.externalId]).to.deep.equal({
              amount: queryParamAmount,
              amountProvidedByQueryParams: true
            })

            sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/confirm` })
          })
        })

        describe('The product has reference_enabled and a fixed price', () => {
          it('should not add amount to session', () => {
            const product = createProduct(true, 2222)
            const req = {
              product,
              query: {
                amount: queryParamAmount,
                reference: queryParamReference
              }
            }
            const res = {}
            const next = {}

            controller(req, res, next)

            expect(req).to.have.property('session')
            expect(req.session).to.have.property(product.externalId)
            expect(req.session[product.externalId]).to.deep.equal({
              reference: queryParamReference,
              referenceProvidedByQueryParams: true
            })

            sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/confirm` })
          })
        })
      })
    })
    describe('Only the reference is passed in as a query parameter', () => {
      describe('Product has no fixed price', () => {
        it('should render page with continue link to amount page', () => {
          const product = createProduct(true, null)
          const req = {
            product,
            query: {
              reference: queryParamReference
            }
          }
          const res = {}
          const next = {}

          controller(req, res, next)

          expect(req).to.have.property('session')
          expect(req.session).to.have.property(product.externalId)
          expect(req.session[product.externalId]).to.deep.equal({
            reference: queryParamReference,
            referenceProvidedByQueryParams: true
          })

          sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/amount` })
        })
        it('should show pre-filled payment link problem page if reference is not valid', () => {
          const product = createProduct(true, null)
          const req = {
            product,
            query: {
              reference: '[]<>'
            }
          }
          const res = {
            status: statusSpy
          }

          controller(req, res)

          sinon.assert.calledWith(mockResponse.response, req, res,'prefilled-link-error', {
            title: 'paymentLinkError.title',
            message: 'paymentLinkError.invalidReference',
            messagePreamble: 'paymentLinkError.linkProblem'
          })
          sinon.assert.calledOnceWithExactly(statusSpy, 400)

          expect(req).to.not.have.property('session')
        })
      })
    })
    describe('Only the amount is passed in as a query parameter', () => {
      describe('Product has reference enabled', () => {
        it('should render page with continue link to reference page', () => {
          const product = createProduct(true, null)
          const req = {
            product,
            query: {
              amount: queryParamAmount
            }
          }
          const res = {}
          const next = {}

          controller(req, res, next)

          expect(req).to.have.property('session')
          expect(req.session).to.have.property(product.externalId)
          expect(req.session[product.externalId]).to.deep.equal({
            amount: queryParamAmount,
            amountProvidedByQueryParams: true
          })

          sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/reference` })
        })
      })
      it('should show pre-filled payment link problem page when amount in query parameter is invalid', () => {
        const product = createProduct(false, null)
        const req = {
          product,
          query: {
            amount: 'not-valid-amount'
          }
        }
        const res = {
          status: statusSpy
        }

        controller(req, res)

        sinon.assert.calledWith(mockResponse.response, req, res,'prefilled-link-error', {
          title: 'paymentLinkError.title',
          message: 'paymentLinkError.invalidAmount',
          messagePreamble: 'paymentLinkError.linkProblem'
        })
        sinon.assert.calledOnceWithExactly(statusSpy, 400)

        expect(req).to.not.have.property('session')
      })
      it('should show pre-filled payment link problem page when amount in query parameter is above the maximum', () => {
        const product = createProduct(false, null)
        const req = {
          product,
          query: {
            amount: '10000001'
          }
        }
        const res = {
          status: statusSpy
        }

        controller(req, res)

        sinon.assert.calledWith(mockResponse.response, req, res,'prefilled-link-error', {
          title: 'paymentLinkError.title',
          message: 'paymentLinkError.invalidAmount',
          messagePreamble: 'paymentLinkError.linkProblem'
        })
        sinon.assert.calledOnceWithExactly(statusSpy, 400)

        expect(req).to.not.have.property('session')
      })
      it('should show pre-filled payment link problem page when amount in query parameter is negative', () => {
        const product = createProduct(false, null)
        const req = {
          product,
          query: {
            amount: '-1000'
          }
        }
        const res = {
          status: statusSpy
        }

        controller(req, res)

        sinon.assert.calledWith(mockResponse.response, req, res,'prefilled-link-error', {
          title: 'paymentLinkError.title',
          message: 'paymentLinkError.invalidAmount',
          messagePreamble: 'paymentLinkError.linkProblem'
        })
        sinon.assert.calledOnceWithExactly(statusSpy, 400)

        expect(req).to.not.have.property('session')
      })
    })
    describe('Values have previously been loaded from query params and page is revisited', () => {
      it('should render the start payment link page with continue to confirm page', () => {
        const product = createProduct(true, 1000)
        const req = {
          product,
          session: {
            'product-external-id': {
              reference: queryParamReference,
              amount: queryParamAmount,
              referenceProvidedByQueryParams: true,
              amountProvidedByQueryParams: true
            }
          }
        }
        const res = {}

        controller(req, res)

        sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/confirm` })
      })
    })
  })
})
