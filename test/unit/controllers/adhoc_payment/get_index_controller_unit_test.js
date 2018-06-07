'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const {expect} = require('chai')

const productFixtures = require('../../../fixtures/product_fixtures')
const responseSpy = sinon.spy()
const mockResponses = {
  response: responseSpy
}
const adhocCtrl = proxyquire('../../../../app/controllers/adhoc_payment/get_index_controller', {
  '../../utils/response': mockResponses
})

let req, res

describe('get adhoc controller with reference enabled and reference set ', () => {
  const product = productFixtures.validCreateProductResponse({
    reference_enabled: true
  }).getPlain()

  before(() => {
    res = {}
    req = {
      correlationId: '123',
      referenceNumber: 'Test reference',
      product
    }
    adhocCtrl(req, res)
  })

  it('should call method response', () => {
    expect(responseSpy.called).to.equal(true)
  })

  it(`should pass req, res and 'adhoc-payment/index' to the response method`, () => {
    expect(mockResponses.response.args[0]).to.include(req)
    expect(mockResponses.response.args[0]).to.include(res)
    expect(mockResponses.response.args[0]).to.include('adhoc-payment/index')
  })

  it(`should pass data to the responses.response method with a 'referenceNumber' property equal to 'Test reference'`, () => {
    expect(mockResponses.response.args[0][3]).to.have.property('referenceNumber').to.equal('Test reference')
  })
})
