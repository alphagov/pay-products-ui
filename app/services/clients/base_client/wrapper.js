'use strict'
const lodash = require('lodash')
const joinURL = require('url-join')
const correlator = require('correlation-id')
const requestLogger = require('../../../utils/request_logger')
const CORRELATION_HEADER = require('../../../../config/index').CORRELATION_HEADER
const SUCCESS_CODES = [200, 201, 202, 204, 206]

module.exports = function (method, verb) {
  return (uri, opts, cb) => new Promise((resolve, reject) => {
    if (typeof uri === 'string') {
      opts = opts || {}
      opts.url = uri
    } else {
      cb = opts
      opts = uri
    }
    if (verb) opts.method = verb.toUpperCase()
    if (!cb) cb = defaultCallback
    const context = {
      correlationId: correlator.getId(),
      startTime: new Date(),
      url: joinURL(lodash.get(opts, 'baseUrl', ''), opts.url),
      method: opts.method,
      description: opts.description,
      service: opts.service
    }
    lodash.set(opts, `headers.${CORRELATION_HEADER}`, context.correlationId)

    // start request
    requestLogger.logRequestStart(context)
    const call = method(opts, cb)
    // Add event listeners for logging
    call.on('error', err => {
      requestLogger.logRequestEnd(context)
      requestLogger.logRequestError(context, err)
    })
    call.on('response', response => {
      requestLogger.logRequestEnd(context)
      if (!(response && SUCCESS_CODES.includes(response.statusCode))) {
        requestLogger.logRequestFailure(context, response)
      }
    })
    function defaultCallback (err, response, body) {
      if (err) {
        reject(err)
      } else if (response && SUCCESS_CODES.includes(response.statusCode)) {
        resolve(body)
      } else {
        const err = new Error(response.body)
        err.errorCode = response.statusCode
        reject(err)
      }
    }
  })
}
