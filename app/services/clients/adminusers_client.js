'use strict'

// Local dependencies
const baseClient = require('./base_client/base_client')
const Service = require('../../models/Service.class')
const { ADMINUSERS_URL } = require('../../../config')

// Constants
const SERVICE_NAME = 'adminusers'
const baseUrl = `${ADMINUSERS_URL}/v1/api`

function getServiceByGatewayAccountId (gatewayAccountId, correlationId) {
  return baseClient.get({
    baseUrl,
    url: `/services?gatewayAccountId=${gatewayAccountId}`,
    description: `find a product by it's external id`,
    service: SERVICE_NAME,
    correlationId: correlationId
  }).then(service => new Service(service))
}

module.exports = {
  getServiceByGatewayAccountId: getServiceByGatewayAccountId
}
