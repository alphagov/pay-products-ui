'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const productFixtures = require('../../../test/fixtures/product.fixtures')
const responseSpy = sinon.spy()
const Product = require('../../models/Product.class')

const mockResponses = {
  response: responseSpy
}

let req, res

describe('Amount Page - POST controller', () => {
  const mockCookie = {
    getSessionVariable: sinon.stub(),
    setSessionVariable: sinon.stub()
  }

  const controller = proxyquire('./post-index.controller', {
    '../../utils/response': mockResponses,
    '../../utils/cookie': mockCookie
  })

  const product = new Product(productFixtures.validCreateProductResponse({
    type: 'ADHOC',
    reference_enabled: true,
    price: null
  }).getPlain())

  beforeEach(() => {
    mockCookie.getSessionVariable.reset()
    mockCookie.setSessionVariable.reset()
    responseSpy.resetHistory()
  })

  it('when a valid amount is entered, it should save the amount to the session and ' +
    'redirect to the confirm page', () => {
    req = {
      correlationId: '123',
      product,
      body: {
        'payment-amount': '1000'
      }
    }

    res = {
      redirect: sinon.spy()
    }

    controller(req, res)

    sinon.assert.calledWith(mockCookie.setSessionVariable, req, 'paymentAmount', '1000')
    sinon.assert.calledWith(res.redirect, '/pay/an-external-id/confirm')
  })

  it('when an empty amount is entered, it should display an error message and the back link correctly', () => {
    req = {
      correlationId: '123',
      product,
      body: {
        'payment-amount': ''
      }
    }

    res = {
      redirect: sinon.spy(),
      locals: {
        __p: sinon.spy()
      }
    }

    controller(req, res)

    sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

    const pageData = mockResponses.response.args[0][3]
    expect(pageData.backLinkHref).to.equal('/pay/an-external-id/reference')

    sinon.assert.calledWith(res.locals.__p, 'paymentLinksV2.fieldValidation.enterAnAmountInPounds')
  })

  it('when an invalid amount is entered and an amount is already saved to the session, it should display an error' +
  'message and set the back link to the CONFIRM page', () => {
    mockCookie.getSessionVariable.returns(1000)

    req = {
      correlationId: '123',
      product,
      body: {
        'payment-amount': 'invalid amount'
      }
    }

    res = {
      redirect: sinon.spy(),
      locals: {
        __p: sinon.spy()
      }
    }

    controller(req, res)

    sinon.assert.calledWith(responseSpy, req, res, 'amount/amount')

    const pageData = mockResponses.response.args[0][3]
    expect(pageData.backLinkHref).to.equal('/pay/an-external-id/confirm')

    sinon.assert.calledWith(res.locals.__p, 'paymentLinksV2.fieldValidation.enterAnAmountInTheCorrectFormat')
  })
})
