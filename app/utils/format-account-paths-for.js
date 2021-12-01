'use strict'
const formattedPathFor = require('./replace-params-in-path')

function formatAccountPathsFor (path, gatewayAccountExternalId, ...params) {
  return formattedPathFor(path, gatewayAccountExternalId, ...params)
}

module.exports = formatAccountPathsFor
