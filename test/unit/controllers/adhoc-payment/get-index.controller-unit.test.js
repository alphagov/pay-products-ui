'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')

const productFixtures = require('../../../fixtures/product_fixtures')
const serviceFixtures = require('../../../fixtures/service_fixtures')
const Service = require('../../../../app/models/Service.class')
const responseSpy = sinon.spy()
const mockResponses = {
  response: responseSpy
}
const indexSpy = sinon.spy()
const mockReferenceCtrl = {
  index: indexSpy
}

let req, res

describe('get adhoc controller with reference enabled', () => {
  const mockCookie = {
    getSessionVariable: sinon.stub().returns('Test reference')
  }
  const adhocCtrl = proxyquire('../../../../app/controllers/adhoc_payment/get_index_controller', {
    '../../utils/response': mockResponses,
    '../product_reference': mockReferenceCtrl,
    '../../utils/cookie': mockCookie
  })

  const product = productFixtures.validCreateProductResponse({
    type: 'ADHOC',
    reference_enabled: true
  }).getPlain()
  const service = new Service(serviceFixtures.validServiceResponse().getPlain())
  describe(`when reference set `, () => {
    before(() => {
      res = {}
      req = {
        correlationId: '123',
        product,
        service
      }
      adhocCtrl(req, res)
    })

    it('should call method response', () => {
      expect(responseSpy.called).to.equal(true)
    })

    it(`should pass req, res and 'adhoc-payment/index' to the response method to navigate to load view payment amount`, () => {
      expect(mockResponses.response.args[0]).to.include(req)
      expect(mockResponses.response.args[0]).to.include(res)
      expect(mockResponses.response.args[0]).to.include('adhoc-payment/index')
    })
  })
  describe(`when reference not set `, () => {
    const mockCookie = {
      getSessionVariable: sinon.stub().returns(undefined)
    }
    const adhocCtrl = proxyquire('../../../../app/controllers/adhoc_payment/get_index_controller', {
      '../../utils/response': mockResponses,
      '../product_reference': mockReferenceCtrl,
      '../../utils/cookie': mockCookie
    })

    before(() => {
      res = {}
      req = {
        correlationId: '123',
        product,
        service
      }
      adhocCtrl(req, res)
    })

    it('should call method response', () => {
      expect(indexSpy.called).to.equal(true)
    })

    it(`should pass req, res to the response method to navigate back to reference page`, () => {
      expect(mockReferenceCtrl.index.args[0]).to.include(req)
      expect(mockReferenceCtrl.index.args[0]).to.include(res)
    })
  })
})
