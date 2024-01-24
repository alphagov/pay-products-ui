'use strict'

// Local dependencies
// const baseClient = require('../base/base.client')
// const { Client } = require('../base/axios-base-client')
const { Client } = require('@govuk-pay/pay-js-commons/src/utils/axios-base-client')
const { configureClient } = require('../base/config')
// const Service = require('../../models/Service.class')
const { ADMINUSERS_URL } = require('../../../config')

// Constants
const SERVICE_NAME = 'adminusers'
const baseUrl = `${ADMINUSERS_URL}/v1/api`

function getServiceByGatewayAccountId (gatewayAccountId, correlationId) {
  this.client = new Client(SERVICE_NAME)
  const url = `${baseUrl}/services?gatewayAccountId=${gatewayAccountId}`
  configureClient(this.client, url)
  // return baseClient.get({
  //   baseUrl,
  //   url: `/services?gatewayAccountId=${gatewayAccountId}`,
  //   description: 'find a service by it\'s external id',
  //   service: SERVICE_NAME,
  //   correlationId: correlationId
  // }).then(service => new Service(service))
  return this.client.get(url, 'find a service by it\'s external id')
      .then(response => response.data)
}

module.exports = {
  getServiceByGatewayAccountId: getServiceByGatewayAccountId
}
