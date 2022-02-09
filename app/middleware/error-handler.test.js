'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { NotFoundError } = require('../errors')

const req = {
  correlationId: 1234
}

describe('Error handler middleware', () => {
  let res, errorHandler, infoLoggerSpy

  const next = sinon.spy()
  const responseSpy = sinon.spy()
  const mockResponses = {
    response: responseSpy
  }

  beforeEach(() => {
    res = {
      status: sinon.spy()
    }

    infoLoggerSpy = sinon.spy()
    errorHandler = proxyquire('./error-handler', {
      '../utils/logger': () => {
        return {
          info: infoLoggerSpy
        }
      },
      '../utils/response': mockResponses
    })
  })

  it('should render a 404 page and log message', () => {
    const err = new NotFoundError('404 test error')
    errorHandler(err, req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnce(res.status)
    sinon.assert.calledWith(res.status, 404)
    sinon.assert.calledOnce(responseSpy)
    sinon.assert.calledWith(responseSpy, req, res, '404')

    const expectedMessage = '[1234] NotFoundError handled: 404 test error. Rendering 404 page'
    sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
  })
})
