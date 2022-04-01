'use strict'

const url = require('url')

const logger = require('../utils/logger')(__filename)
const productsClient = require('../services/clients/products.client')
const { renderErrorView } = require('../utils/response')
const replaceParamsInPath = require('../utils/replace-params-in-path')
const paths = require('../paths')

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

module.exports = async function redirectToProduct(req, res) {
  const { serviceNamePath, productNamePath } = req.params
  try {
    const product = await productsClient.product.getByProductPath(serviceNamePath, productNamePath)
    const payUrl = url.format({
      pathname: replaceParamsInPath(paths.pay.product, product.externalId),
      query: req.query
    })
    logger.info(`Redirecting to ${payUrl}`)
    return res.redirect(payUrl)
  } catch (err) {
    logger.error(`[${req.correlationId}] Error getting product: ${err.message} errorCode=${err.errorCode}`)
    return renderErrorView(req, res, errorMessagePath, err.errorCode || 500)
  }
}
