'use strict'

const serviceFixtures = require('../../fixtures/service.fixtures')
const { stubBuilder } = require('./stub-builder')

function getServiceSuccess (opts) {
  const fixtureOpts = {
    gateway_account_ids: [opts.gatewayAccountId],
    service_name: opts.serviceName,
    external_id: opts.serviceExternalId,
    organisationName: opts.organisationName,
    merchant_details: opts.merchant_details,
    custom_branding: opts.customBranding ? {
      image_url: opts.customBranding.imageUrl,
      css_url: opts.customBranding.cssUrl
    } : null
  }

  const path = '/v1/api/services'
  return stubBuilder('GET', path, 200, {
    query: { gatewayAccountId: opts.gatewayAccountId },
    response: serviceFixtures.validServiceResponse(fixtureOpts)
  })
}

module.exports = {
  getServiceSuccess
}
