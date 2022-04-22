'use strict'

const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { paymentLinksV2 } = require('../../paths')

module.exports = function getBackLinkUrl (isEditing, product, referenceProvidedByQueryParams) {
  if (isEditing) {
    return replaceParamsInPath(paymentLinksV2.confirm, product.externalId)
  } else if (product.reference_enabled && !referenceProvidedByQueryParams) {
    return replaceParamsInPath(paymentLinksV2.reference, product.externalId)
  } else {
    return replaceParamsInPath(paymentLinksV2.product, product.externalId)
  }
}
