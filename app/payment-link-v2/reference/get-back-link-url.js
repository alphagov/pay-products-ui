'use strict'

const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { paymentLinksV2 } = require('../../paths')

module.exports = function getBackLinkUrl (isEditing, product) {
  if (isEditing) {
    return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
  } else {
    return replaceParamsInPath(paymentLinksV2.product, product.externalId)
  }
}
