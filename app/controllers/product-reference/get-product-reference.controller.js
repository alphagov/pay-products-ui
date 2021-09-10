'use strict'

const logger = require('../../utils/logger')(__filename)
const response = require('../../utils/response').response
const { pay } = require('../../paths')
const { getSessionVariable } = require('../../utils/cookie')

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    productDescription: product.description,
    paymentReferenceLabel: product.reference_label,
    captchaChallengeFailed: req.captchaChallengeFailed
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

  if (req.confirmReferenceNumber) {
    logger.info(`[${correlationId}] Potential PAN number entered in the reference field for ${product.externalId}. `)
    data.confirmReferenceNumber = req.confirmReferenceNumber
    data.backToStartPage = pay.product.replace(':productExternalId', product.externalId)
  } else {
    logger.info(`[${correlationId}] initiating product payment for ${product.externalId}`)
  }

  response(req, res, 'reference/index', data)
}
