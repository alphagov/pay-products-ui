/* eslint-disable */
const sinon = require('sinon')
const { expect } = require('chai')

const mockRequest = {
  method: 'GET',
  body: {},
  route: { methods: { get: true } },
  headers: {}
}

const requireHelper = function requireHelper (module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}

describe('CSP middleware', () => {
  it('should not set the Content-Security-Policy header if the feature is switched off', () => {
    process.env.CSP_SEND_HEADER = 'false'
    const csp = requireHelper('./csp.js')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy(), removeHeader: sinon.spy() }
    csp.sendCspHeader(mockRequest, response, next)

    expect(next.called).to.be.true
    expect(response.setHeader.called).to.be.false
  })

  it('should set Report-Only on Content-Security-Policy if enforce policy is switched off', () => {
    process.env.CSP_SEND_HEADER = 'true'
    process.env.CSP_ENFORCE = 'false'
    const csp = requireHelper('./csp.js')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy(), removeHeader: sinon.spy() }
    csp.sendCspHeader(mockRequest, response, next)

    sinon.assert.calledWith(response.setHeader, 'Content-Security-Policy-Report-Only')
  })

  it('should set standard Content-Security-Policy header (enforced) if enforce policy is switched on', () => {
    process.env.CSP_SEND_HEADER = 'true'
    process.env.CSP_ENFORCE = 'true'
    const csp = requireHelper('./csp.js')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy(), removeHeader: sinon.spy() }
    csp.sendCspHeader(mockRequest, response, next)

    sinon.assert.calledWith(response.setHeader, 'Content-Security-Policy')
  })

  it('should set Reporting-Endpoints header if enforce policy is switched on', () => {
    process.env.CSP_SEND_HEADER = 'true'
    process.env.CSP_ENFORCE = 'true'
    const csp = requireHelper('./csp.js')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy(), removeHeader: sinon.spy() }
    csp.setReportingEndpoints(mockRequest, response, next)

    sinon.assert.calledWith(response.setHeader, 'Reporting-Endpoints')
  })
})
