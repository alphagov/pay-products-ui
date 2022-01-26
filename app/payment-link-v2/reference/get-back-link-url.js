'use strict'

const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { paymentLinksV2 } = require('../../paths')

module.exports = function getBackLinkUrl (reference, product) {
  if (reference) {
    return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
  } else {
    return replaceParamsInPath(paymentLinksV2.product, product.externalId)
  }
}
