'use strict'

const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { paymentLinks } = require('../../paths')

module.exports = function getBackLinkUrl (isEditing, product) {
  if (isEditing) {
    return replaceParamsInPath(paymentLinks.confirm, product.externalId)
  } else {
    return replaceParamsInPath(paymentLinks.product, product.externalId)
  }
}
