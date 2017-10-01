'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const q = require('q')
chai.use(chaiAsPromised)
const proxyquire = require('proxyquire')

const productFixtures = require('../../fixtures/product_fixtures')
const Product = require('../../../app/models/Product.class')
const Charge = require('../../../app/models/Charge.class')
const expect = chai.expect
const productService = (productsClientMock) => {
  return proxyquire('../../../app/services/product_service.js',
    {
      './clients/products_client': productsClientMock
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

describe('product service', function () {
  context('Find product', function () {
    it('should find a product successfully', function (done) {
      let productSuccessMock = () => {
        return {
          getProduct: () => {
            return resolved(new Product(productFixtures.validCreateProductResponse(productData).getPlain()))
          }
        }
      }

      productService(productSuccessMock)
          .getProduct(productData.external_product_id).should.be.fulfilled.then(product => {
            expect(product.externalServiceId).to.equal(productData.external_service_id)
            expect(product.externalProductId).to.equal(productData.external_product_id)
            expect(product.name).to.equal(productData.name)
            expect(product.price).to.equal(productData.price)
          }).should.notify(done)
    })

    it('should fail if an error on product finding', function (done) {
      let productFailMock = () => {
        return {
          getProduct: () => {
            return rejected()
          }
        }
      }

      productService(productFailMock)
        .getProduct(productData.external_product_id).should.be.rejected
        .notify(done)
    })
  })

  context('Create charge', function () {
    let externalChargeId = 'valid-external-charge-id'
    let chargeData = {
      external_product_id: productData.external_product_id,
      amount: productData.price,
      description: productData.name,
      external_charge_id: externalChargeId
    }
    let product = new Product(productFixtures.validCreateProductResponse(productData).getPlain())

    it('should create a charge successfully', function (done) {
      let chargeSuccessMock = () => {
        return {
          createCharge: () => {
            return resolved(new Charge(productFixtures.validCreateChargeResponse(chargeData).getPlain()))
          }
        }
      }

      productService(chargeSuccessMock)
        .createCharge(product).should.be.fulfilled.then(charge => {
          expect(charge.externalProductId).to.equal(productData.external_product_id)
          expect(charge.description).to.equal(productData.name)
          expect(charge.amount).to.equal(productData.price)
          expect(charge.externalChargeId).to.equal(externalChargeId)
        }).should.notify(done)
    })

    it('should fail if on error creating a charge', function (done) {
      let chargeFailMock = () => {
        return {
          createCharge: () => {
            return rejected()
          }
        }
      }

      productService(chargeFailMock)
        .createCharge(product).should.be.rejected.should.notify(done)
    })
  })
})
