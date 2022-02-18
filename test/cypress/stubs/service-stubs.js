'use strict'

const serviceFixtures = require('../../fixtures/service.fixtures')
const { stubBuilder } = require('./stub-builder')

function getServiceSuccess (opts) {
  const serviceName = {
    en: opts.serviceName.en
  }
  if (opts.serviceName.cy) {
    serviceName.cy = opts.serviceName.cy
  }

  const fixtureOpts = {
    gateway_account_ids: [opts.gatewayAccountId],
    service_name: serviceName,
    external_id: opts.serviceExternalId
  }
  const path = '/v1/api/services'
  return stubBuilder('GET', path, 200, {
    query: { gatewayAccountId: opts.gatewayAccountId },
    response: serviceFixtures.validServiceResponse(fixtureOpts),
    verifyCalledTimes: opts.verifyCalledTimes
  })
}

module.exports = {
  getServiceSuccess
}
