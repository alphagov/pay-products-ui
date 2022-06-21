'use strict'

const logger = require('../utils/logger')(__filename)
const response = require('../utils/response')
const { renderErrorView } = response
const productsClient = require('../services/clients/products.client')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json
const paymentForbiddenErrorMessagePath = 'error.accountCannotTakePayments'

module.exports = (req, res) => {
  const product = req.product
  const correlationId = req.correlationId
  const paymentAmount = req.paymentAmount // may be undefined
  const referenceNumber = req.referenceNumber // may be undefined
  if (product) {
    logger.info(`[${correlationId}] creating charge for product ${product.name}`)
    return productsClient.payment.create(product.externalId, paymentAmount, referenceNumber)
      .then(payment => {
        logger.info(`[${correlationId}] initiating payment for charge ${payment.externalChargeId}`)
        return res.redirect(303, payment.links.next.href)
      })
      .catch(err => {
        logger.info(`[${correlationId}] error creating charge for product ${product.externalId}. err = ${err}`)
        if (err.errorCode === 403) {
          return renderErrorView(req, res, paymentForbiddenErrorMessagePath, 400)
        } else {
          return renderErrorView(req, res, errorMessagePath, err.errorCode || 500)
        }
      })
  } else {
    logger.error(`[${correlationId}] product not found to make payment`)
    return renderErrorView(req, res, errorMessagePath, 500)
  }
}
