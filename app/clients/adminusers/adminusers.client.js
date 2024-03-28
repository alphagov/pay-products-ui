'use strict'

// Local dependencies
const { HttpsBaseClient } = require('@govuk-pay/pay-js-commons')
const { configureClient } = require('../base/config')
const Service = require('../../models/Service.class')
const { ADMINUSERS_URL } = require('../../../config')

// Constants
const SERVICE_NAME = 'adminusers'
const baseUrl = `${ADMINUSERS_URL}/v1/api`

async function getServiceByGatewayAccountId (gatewayAccountId, correlationId) {
  this.client = new HttpsBaseClient(SERVICE_NAME)
  const url = `${baseUrl}/services?gatewayAccountId=${gatewayAccountId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a service by it\'s external id')
  return new Service(response.data)
}

module.exports = {
  getServiceByGatewayAccountId: getServiceByGatewayAccountId
}
