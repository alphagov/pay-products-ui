'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const {
  NotFoundError,
  AccountCannotTakePaymentsError,
  InvalidPrefilledAmountError,
  InvalidPrefilledReferenceError
} = require('../errors')

const req = {
  correlationId: 1234
}

describe('Error handler middleware', () => {
  let res, errorHandler, infoLoggerSpy, errorLoggerSpy

  const next = sinon.spy()
  const responseSpy = sinon.spy()
  const statusSpy = sinon.spy()
  const mockResponses = {
    response: responseSpy
  }

  beforeEach(() => {
    next.resetHistory()
    responseSpy.resetHistory()
    statusSpy.resetHistory()
    res = {
      status: statusSpy
    }

    infoLoggerSpy = sinon.spy()
    errorLoggerSpy = sinon.spy()
    errorHandler = proxyquire('./error-handler', {
      '../utils/logger': () => {
        return {
          info: infoLoggerSpy,
          error: errorLoggerSpy
        }
      },
      '../utils/response': mockResponses
    })
  })

  it('should render a 404 page and log message', () => {
    const err = new NotFoundError('404 test error')
    errorHandler(err, req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnceWithExactly(statusSpy, 404)
    sinon.assert.calledOnceWithExactly(responseSpy, req, res, '404')

    const expectedMessage = 'NotFoundError handled: 404 test error. Rendering 404 page'
    sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
  })

  it('should render a 400 page and log message when AccountCannotTakePaymentsError error handled', () => {
    const err = new AccountCannotTakePaymentsError('test error')
    errorHandler(err, req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnceWithExactly(statusSpy, 400)
    sinon.assert.calledOnceWithExactly(responseSpy, req, res, 'error', { message: 'error.contactService' })

    const expectedMessage = 'AccountCannotTakePaymentsError handled: test error. Rendering error page'
    sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
  })

  it('should render a 400 page and log message when InvalidPrefilledAmountError handled', () => {
    const err = new InvalidPrefilledAmountError('test error')
    errorHandler(err, req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnceWithExactly(statusSpy, 400)
    sinon.assert.calledOnceWithExactly(responseSpy, req, res, 'error', { message: 'error.contactService', messageAmount: 'error.invalidAmount', messageReference: '' })

    const expectedMessage = 'InvalidPrefilledAmountError handled: test error. Rendering error page'
    sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
  })

  it('should render a 400 page and log message when InvalidPrefilledReferenceError handled', () => {
    const err = new InvalidPrefilledReferenceError('test error')
    errorHandler(err, req, res, next)
    sinon.assert.notCalled(next)
    sinon.assert.calledOnceWithExactly(statusSpy, 400)
    sinon.assert.calledOnceWithExactly(responseSpy, req, res, 'error', { message: 'error.contactService', messageAmount: '', messageReference: 'error.invalidReference'  })

    const expectedMessage = 'InvalidPrefilledReferenceError handled: test error. Rendering error page'
    sinon.assert.calledWith(infoLoggerSpy, expectedMessage)
  })
})
