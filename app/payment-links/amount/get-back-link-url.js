'use strict'

const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { paymentLinks } = require('../../paths')

module.exports = function getBackLinkUrl (isEditing, product, referenceProvidedByQueryParams) {
  if (isEditing) {
    return replaceParamsInPath(paymentLinks.confirm, product.externalId)
  } else if (product.reference_enabled && !referenceProvidedByQueryParams) {
    return replaceParamsInPath(paymentLinks.reference, product.externalId)
  } else {
    return replaceParamsInPath(paymentLinks.product, product.externalId)
  }
}
