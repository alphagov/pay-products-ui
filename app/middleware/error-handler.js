'use strict'

const { NotFoundError } = require('../errors')
const { response } = require('../utils/response')

const logger = require('../utils/logger')(__filename)

module.exports = function (err, req, res, next) {
  if (err instanceof NotFoundError) {
    logger.info(`NotFoundError handled: ${err.message}. Rendering 404 page`)
    res.status(404)
    return response(req, res, '404')
  }

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

  // log the exception
  logger.error(`[requestId=${req.correlationId}] Internal server error`, errorPayload)
  // re-throw it
  next(err)
}
