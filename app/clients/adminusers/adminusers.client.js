'use strict'

// Local dependencies
const { Client } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client')
const { configureClient } = require('../base/config')
const Service = require('../../models/Service.class')
const { ADMINUSERS_URL } = require('../../../config')

// Constants
const SERVICE_NAME = 'adminusers'
const baseUrl = `${ADMINUSERS_URL}/v1/api`

async function getServiceByGatewayAccountId (gatewayAccountId, correlationId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/services?gatewayAccountId=${gatewayAccountId}`
  configureClient(this.client, url)
  const response = await this.client.get(url, 'find a service by it\'s external id')
  return new Service(response.data)
}

module.exports = {
  getServiceByGatewayAccountId: getServiceByGatewayAccountId
}
