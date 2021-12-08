'use strict'

const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { paymentLinksV2 } = require('../../paths')

module.exports = function getBackLinkUrl (amount, product) {
  if (amount) {
    return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
  } else if (product.reference_enabled) {
    return replaceParamsInPath(paymentLinksV2.reference, product.externalId)
  } else {
    return replaceParamsInPath(paymentLinksV2.product, product.externalId)
  }
}
