'use strict'

const logger = require('../utils/logger')(__filename)
const { CORRELATION_ID } = require('@govuk-pay/pay-js-commons').logging.keys

const ERROR_MESSAGE = 'error.default' // This is the object notation to string in en.json
const ERROR_VIEW = 'error'

function response (req, res, template, data) {
  return res.render(template, data)
}

function errorResponse (req, res, msg = ERROR_MESSAGE, status = 500) {
  const errorMeta = {
    status,
    error_message: msg
  }
  errorMeta[CORRELATION_ID] = req.correlationId

  if (status === 500) {
    logger.info('An error has occurred. Rendering error view', errorMeta)
  } else {
    logger.info('An error has occurred. Rendering error view', errorMeta)
  }

  res.setHeader('Content-Type', 'text/html')
  res.status(status)
  res.render(ERROR_VIEW, { message: msg })
}

module.exports = {
  response,
  renderErrorView: errorResponse
}
