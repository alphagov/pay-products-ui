'use strict'

const logger = require('../utils/logger')(__filename)
const response = require('../utils/response')
const { renderErrorView } = response

const makePayment = require('./make_payment_controller')
const adhocPaymentCtrl = require('./adhoc_payment')
const productReferenceCtrl = require('./product_reference')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId

  logger.info(`[${correlationId}] routing product of type ${product.type}`)
  switch (product.type) {
    case ('DEMO'):
    case ('PROTOTYPE'):
      return makePayment(req, res)
    case ('ADHOC'):
    case ('AGENT_INITIATED_MOTO'):
      if (product.reference_enabled) {
        return productReferenceCtrl.index(req, res)
      } else {
        return adhocPaymentCtrl.index(req, res)
      }
    default:
      logger.error(`[${correlationId}] error routing product of type ${product.type}`)
      return renderErrorView(req, res, errorMessagePath, 500)
  }
}
