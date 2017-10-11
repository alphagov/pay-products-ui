'use strict'
const requestLogger = require('../utils/request_logger')
const correlator = require('correlation-id')
const joinURL = require('url-join')
const lodash = require('lodash')

const SUCCESS_CODES = [200, 201, 202, 204, 206]

module.exports = {
  /**
   * Converts a method from the 'request' module into a something that returns a promise
   * while also logging all the things we want from the context
   *
   * @private
   * @param {Function} method the request method you want to use
   * @param {Object} context
   * @param {...requestArgs} the arguments to pass to the request function
   * @returns {function}
   */
  // TODO: move into baseClient so that it doesn't need to be called every time, this should include moving context definition into this method
  requestMethodPromisify: (method, context, ...requestArgs) => new Promise((resolve, reject) => {
    context.correlationId = correlator.getId()
    context.startTime = new Date()
    context.url = typeof requestArgs[0] === 'string' ? requestArgs[0] : joinURL(lodash.get(requestArgs, '[0].baseUrl', ''), requestArgs[0].url)
    requestLogger.logRequestStart(context)
    method(...requestArgs, (err, response, body) => {
      requestLogger.logRequestEnd(context)
      if (err) {
        requestLogger.logRequestError(context, err)
        reject(err)
      } else if (response && SUCCESS_CODES.includes(response.statusCode)) {
        resolve(body)
      } else {
        requestLogger.logRequestFailure(context, response)
        const err = new Error(response.body)
        err.errorCode = response.statusCode
        reject(err)
      }
    })
  }),
  successCodes: () => {
    return SUCCESS_CODES
  }
}
