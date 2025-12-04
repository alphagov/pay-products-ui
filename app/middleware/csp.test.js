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

  describe('form-action CSP attribute', () => {
    it('should add the FRONTEND_URL to the form action when is set', () => {
      process.env.CSP_SEND_HEADER = 'true'
      process.env.CSP_ENFORCE = 'true'
      process.env.FRONTEND_URL = 'https://www.example.com'
      const csp = requireHelper('./csp.js')

      const next = sinon.spy()
      const response = { setHeader: sinon.spy(), removeHeader: sinon.spy() }
      csp.sendCspHeader(mockRequest, response, next)

      const cspSetHeaderCall = response.setHeader.getCall(0);

      expect(cspSetHeaderCall.args[1]).to.include("form-action 'self' https://www.example.com;");
    })

    it('should NOT add the FRONTEND_URL to the form action when it is not set', () => {
      process.env.CSP_SEND_HEADER = 'true'
      process.env.CSP_ENFORCE = 'true'
      process.env.FRONTEND_URL = ''
      const csp = requireHelper('./csp.js')

      const next = sinon.spy()
      const response = { setHeader: sinon.spy(), removeHeader: sinon.spy() }
      csp.sendCspHeader(mockRequest, response, next)

      const cspSetHeaderCall = response.setHeader.getCall(0);

      expect(cspSetHeaderCall.args[1]).to.include("form-action 'self';");
    })
  })

  describe('script-src CSP attribute', () => {
    it('should set the CSP script-src attribute correctly', () => {
      process.env.CSP_SEND_HEADER = 'true'
      process.env.CSP_ENFORCE = 'true'
      process.env.FRONTEND_URL = 'https://www.example.com'
      const csp = requireHelper('./csp.js')

      const next = sinon.spy()
      const response = { 
        setHeader: sinon.spy(), 
        removeHeader: sinon.spy(),
        locals: {
          nonce: '12345'
        }
      }
      csp.sendCspHeader(mockRequest, response, next)

      const cspSetHeaderCall = response.setHeader.getCall(0);

      expect(cspSetHeaderCall.args[1]).to.include(
        "script-src" 
        + " 'self'"
        + " 'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='"
        + " 'nonce-12345'"
        + " https://www.recaptcha.net" 
        + " https://recaptchaenterprise.googleapis.com" 
        + " https://www.google.com/recaptcha/" 
        + " https://www.gstatic.com/recaptcha/;"
      );
    })
  })
})
