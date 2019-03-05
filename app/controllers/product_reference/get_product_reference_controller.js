'use strict'

// Node.js core dependencies
const logger = require('winston')

// Custom dependencies
const response = require('../../utils/response').response
const { getSessionVariable } = require('../../utils/cookie')

module.exports = (req, res) => {
  const product = req.product
  const service = req.service
  const correlationId = req.correlationId
  const data = {
    productExternalId: product.externalId,
    serviceName: service.serviceName.en,
    productName: product.name,
    productDescription: product.description,
    paymentReferenceLabel: product.reference_label
  }
  const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')
  if (sessionReferenceNumber) {
    data.referenceNumber = sessionReferenceNumber
  }
  if (product.reference_hint) {
    data.paymentReferenceHint = product.reference_hint
  }

  if (req.errorMessage) {
    data.flash = {
      genericError: req.errorMessage
    }
  }

  logger.info(`[${correlationId}] initiating product payment for ${product.externalId}`)
  response(req, res, 'reference/index', data)
}
