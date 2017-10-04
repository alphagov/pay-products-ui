'use strict'

const chai = require('chai')
const sinon = require('sinon')
const chaiAsPromised = require('chai-as-promised')
const q = require('q')
chai.use(chaiAsPromised)
const proxyquire = require('proxyquire')

const productFixtures = require('../../fixtures/product_fixtures')
const Product = require('../../../app/models/Product.class')
const Charge = require('../../../app/models/Charge.class')
const expect = chai.expect
const payController = (productsServiceMock) => {
  return proxyquire('../../../app/controllers/pay_controller.js',
    {
      '../services/product_service': productsServiceMock
    })
}

const resolved = data => {
  const defer = q.defer()
  defer.resolve(data)
  return defer.promise
}

const rejected = data => {
  const defer = q.defer()
  defer.reject(data)
  return defer.promise
}

let productData = {
  external_service_id: 'an-external-service-id',
  external_product_id: 'an-external-product-id',
  name: 'a-name',
  price: 1234
}

let chargeData = {
  external_charge_id: 'an-external-charge-id',
  external_product_id: 'an-external-product-id',
  description: 'a-product-name',
  price: 1234
}

describe('pay controller', function () {
  it('should redirect to next_url upon successful charge creation', function (done) {
    let product = new Product(productFixtures.validCreateProductResponse(productData).getPlain())
    let charge = new Charge(productFixtures.validCreateChargeResponse(chargeData).getPlain())
    let chargeSuccessMock = {
      createCharge: () => {
        return resolved(charge)
      }
    }

    let req = {
      product: product,
      correlationId: 'an-id'
    }
    let res = {
      redirect: sinon.spy()
    }
    payController(chargeSuccessMock).makePayment(req, res).should.be.fulfilled.then(() => {
      expect(res.redirect.calledWith(303, charge.nextLink.href)).to.equal(true)
    }).should.notify(done)
  })

  it('should display an error if charge creation failed', function (done) {
    let product = new Product(productFixtures.validCreateProductResponse(productData).getPlain())
    let chargeFailMock = {
      createCharge: () => {
        return rejected('failed')
      }
    }

    let req = {
      product: product,
      correlationId: 'an-id'
    }
    let res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy()
    }
    payController(chargeFailMock).makePayment(req, res).should.be.fulfilled.then(() => {
      expect(res.render.calledWith('error', {message: 'We are unable to process your request at this time'})).to.equal(true)
    }).should.notify(done)
  })

  it('should display an error if product is not resolved', function (done) {
    let req = {
      product: undefined,
      correlationId: 'an-id'
    }
    let res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy()
    }
    payController({}).makePayment(req, res)
    expect(res.render.calledWith('error', {message: 'We are unable to process your request at this time'})).to.equal(true)
    done()
  })
})
