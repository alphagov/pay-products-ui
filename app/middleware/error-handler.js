'use strict'

const { NotFoundError, AccountCannotTakePaymentsError } = require('../errors')
const { response } = require('../utils/response')

const logger = require('../utils/logger')(__filename)
const accountCannotTakePaymentsErrorMessagePath = 'error.accountCannotTakePayments'

module.exports = function (err, req, res, next) {
  const errorPayload = {
    request: {
      originalUrl: req.originalUrl,
      url: req.url
    }
  }
  if (typeof err === 'object') {
    errorPayload.error = {
      message: err.message,
      stack: err.stack
    }
  } else {
    errorPayload.error = {
      message: err
    }
  }

  if (res.headersSent) {
    logger.warn(`[${req.correlationId}] Headers already sent for error`, errorPayload)
    return next(err)
  }

  if (err instanceof NotFoundError) {
    logger.info(`NotFoundError handled: ${err.message}. Rendering 404 page`)
    res.status(404)
    return response(req, res, '404')
  }
  if (err instanceof AccountCannotTakePaymentsError) {
    logger.info(`AccountCannotTakePaymentsError handled: ${err.message}. Rendering error page`)
    res.status(400)
    return response(req, res, 'error', { message: accountCannotTakePaymentsErrorMessagePath })
  }

  logger.error(`Internal server error`, errorPayload)
  return response(req, res, '500')
}
