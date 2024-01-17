'use strict'

const {
  NotFoundError,
  AccountCannotTakePaymentsError,
  InvalidPrefilledAmountError,
  InvalidPrefilledReferenceError
} = require('../errors')
const { response } = require('../utils/response')

const logger = require('../utils/logger')(__filename)
const contactServiceErrorMessagePath = 'error.contactService'
const linkProblem = 'paymentLinkError.linkProblem'
const invalidReference = 'paymentLinkError.invalidReference'
const invalidAmount = 'paymentLinkError.invalidAmount'
const linkTitle = 'paymentLinkError.title'

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
    logger.warn('Headers already sent for error', errorPayload)
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
    return response(req, res, 'error', { message: contactServiceErrorMessagePath })
  }
  if (err instanceof InvalidPrefilledAmountError) {
    logger.info(`InvalidPrefilledAmountError handled: ${err.message}. Rendering error page`)
    res.status(400)
    return response(req, res, 'prefilled-link-error', { title: linkTitle, message: invalidAmount, messagePreamble: linkProblem })
  }
  if (err instanceof InvalidPrefilledReferenceError) {
    logger.info(`InvalidPrefilledReferenceError handled: ${err.message}. Rendering error page`)
    res.status(400)
    return response(req, res, 'prefilled-link-error', { title: linkTitle, message: invalidReference, messagePreamble: linkProblem })
  }

  logger.error(`Internal server error`, errorPayload)
  return response(req, res, '500')
}
