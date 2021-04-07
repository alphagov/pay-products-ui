'use strict'

// Core Dependencies
const crypto = require('crypto')

// NPM Dependencies
const correlator = require('correlation-id')

// Local Dependencies
const CORRELATION_HEADER = require('../../config').CORRELATION_HEADER

module.exports = correlationMiddleware

function correlationMiddleware (req, res, next) {
  const id = req.headers[CORRELATION_HEADER] || crypto.randomBytes(16).toString('hex')
  req.correlationId = id
  correlator.withId(id, next)
}
