'use strict'

const url = require('url')

const logger = require('../utils/logger')(__filename)
const productsClient = require('../clients/products/products.client')
const { renderErrorView } = require('../utils/response')
const replaceParamsInPath = require('../utils/replace-params-in-path')
const paths = require('../paths')
const { deletePaymentLinkSession } = require('../payment-links/utils/payment-link-session')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

module.exports = async function redirectToProduct (req, res) {
  const { serviceNamePath, productNamePath } = req.params
  try {
    const product = await productsClient.product.getByProductPath(serviceNamePath, productNamePath)
    const payUrl = url.format({
      pathname: replaceParamsInPath(paths.pay.product, product.externalId),
      query: req.query
    })
    // Clear the payment link session - we want to do this as we don't allow users to change the
    // values provided in query parameters by the service. The service may send them a link for the
    // same product without the query parameters, and in this case we do want to allow them to enter
    // values
    deletePaymentLinkSession(req, product.externalId)
    logger.info(`Redirecting to ${payUrl}`)
    return res.redirect(payUrl)
  } catch (err) {
    if (err.errorCode === 404) {
      res.redirect('https://www.gov.uk/404')
      return
    }
    if (err.errorCode >= 500) {
      logger.error(`Error getting product: ${err.message} errorCode=${err.errorCode}`)
    } else {
      logger.info(`Error getting product: ${err.message} errorCode=${err.errorCode}`)
    }
    return renderErrorView(req, res, errorMessagePath, err.errorCode || 500)
  }
}
