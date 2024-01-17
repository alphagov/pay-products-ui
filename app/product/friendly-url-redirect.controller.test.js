'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const productFixtures = require('../../test/fixtures/product.fixtures')
const Product = require('../models/Product.class')

const renderErrorViewSpy = sinon.spy()
const getProductStub = sinon.stub()
const controller = proxyquire('./friendly-url-redirect.controller', {
  '../utils/response': {
    renderErrorView: renderErrorViewSpy
  },
  '../clients/products/products.client': {
    product: {
      getByProductPath: getProductStub
    }
  }
})
const res = {
  redirect: sinon.spy()
}

const serviceNamePath = 'a-service-name'
const productNamePath = 'a-product-name-path'

const product = new Product(productFixtures.validProductResponse({}))

describe('Redirect to product controller', () => {
  beforeEach(() => {
    res.redirect.resetHistory()
    renderErrorViewSpy.resetHistory()
    getProductStub.reset()
  })

  it('should redirect to pay URL', async () => {
    const req = {
      params: {
        serviceNamePath, productNamePath
      }
    }
    getProductStub.withArgs(serviceNamePath, productNamePath).returns(product)
    await controller(req, res)
    sinon.assert.calledWith(res.redirect, `/pay/${product.externalId}`)
  })

  it('should pass query parameters in the redirected URL', async () => {
    const req = {
      params: {
        serviceNamePath, productNamePath
      },
      query: {
        reference: 'ABCD',
        amount: 1000
      }
    }
    getProductStub.withArgs(serviceNamePath, productNamePath).returns(product)
    await controller(req, res)
    sinon.assert.calledWith(res.redirect, `/pay/${product.externalId}?reference=ABCD&amount=1000`)
  })

  it('should render error view if products client returns server error', async () => {
    const req = {
      params: {
        serviceNamePath, productNamePath
      }
    }
    getProductStub.withArgs(serviceNamePath, productNamePath).throws({ errorCode: 500 })
    await controller(req, res)
    sinon.assert.calledWith(renderErrorViewSpy, req, res, 'error.internal', 500)
  })

  it('should redirect if product does not exist', async () => {
    const req = {
      params: {
        serviceNamePath, productNamePath
      }
    }
    getProductStub.withArgs(serviceNamePath, productNamePath).throws({ errorCode: 404 })
    await controller(req, res)
    sinon.assert.calledWith(res.redirect, 'https://www.gov.uk/404')
  })
})
