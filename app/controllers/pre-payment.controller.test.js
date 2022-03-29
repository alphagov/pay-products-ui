'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const productFixtures = require('../../test/fixtures/product.fixtures')
const Product = require('../models/Product.class')

const mockResponse = {
  response: sinon.spy()
}
const mockPaymentLinkV1ReferenceController = {
  index: sinon.spy()
}
const mockPaymentLinkV1IndexController = {
  index: sinon.spy()
}

const controller = proxyquire('./pre-payment.controller', {
  '../utils/response': mockResponse,
  './product-reference': mockPaymentLinkV1ReferenceController,
  './adhoc-payment': mockPaymentLinkV1IndexController
})
const productExternalId = 'product-external-id'

describe('Pre payment controller', () => {

  beforeEach(() => {
    mockResponse.response.resetHistory()
  })

  describe('The product type is ADHOC', () => {
    describe('The new payment link journey is enabled', () => {
      describe('The product has reference enabled', () => {
        it('should render the start payment link page with continue to reference page', () => {
          const product = new Product(productFixtures.validProductResponse({
            type: 'ADHOC',
            external_id: productExternalId,
            reference_enabled: true,
            price: 1000,
            new_payment_link_journey_enabled: true
          }))
          const req = { product }
          const res = {}

          controller(req, res)

          sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/reference` })
        })
      })
      describe('The product has reference disabled and does not have fixed price', () => {
        it('should render the start payment link page with continue to amount page', () => {
          const product = new Product(productFixtures.validProductResponse({
            type: 'ADHOC',
            external_id: productExternalId,
            reference_enabled: false,
            price: null,
            new_payment_link_journey_enabled: true
          }))
          const req = { product }
          const res = {}

          controller(req, res)

          sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/amount` })
        })
      })
      describe('The product has reference disabled and fixed price', () => {
        it('should render the start payment link page with continue to confirm page', () => {
          const product = new Product(productFixtures.validProductResponse({
            type: 'ADHOC',
            external_id: productExternalId,
            reference_enabled: false,
            price: 1000,
            new_payment_link_journey_enabled: true
          }))
          const req = { product }
          const res = {}

          controller(req, res)

          sinon.assert.calledWith(mockResponse.response, req, res, 'start/start', { continueUrl: `/pay/${productExternalId}/confirm` })
        })
      })
    })
    describe('The new payment link journey is disabled', () => {
      describe('The product has reference enabled', () => {
        it('Should call the payment links V1 reference controller', () => {
          const product = new Product(productFixtures.validProductResponse({
            type: 'ADHOC',
            external_id: productExternalId,
            reference_enabled: true,
            price: 1000,
            new_payment_link_journey_enabled: false
          }))
          const req = { product }
          const res = {}

          controller(req, res)

          sinon.assert.calledWith(mockPaymentLinkV1ReferenceController.index, req, res)
        })
      })
      describe('The product has reference disabled', () => {
        it('Should call the payment links V1 index controller', () => {
          const product = new Product(productFixtures.validProductResponse({
            type: 'ADHOC',
            external_id: productExternalId,
            reference_enabled: false,
            price: 1000,
            new_payment_link_journey_enabled: false
          }))
          const req = { product }
          const res = {}

          controller(req, res)

          sinon.assert.calledWith(mockPaymentLinkV1IndexController.index, req, res)
        })
      })
    })
  })
})