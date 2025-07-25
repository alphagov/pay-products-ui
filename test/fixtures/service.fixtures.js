'use strict'

module.exports = {
  validServiceResponse: (serviceData = {}) => {
    const defaultCustomBranding = { cssUrl: 'css url', imageUrl: 'image url' }

    const data = {
      external_id: serviceData.external_id || 'service-external-id',
      service_name: serviceData.service_name || { en: 'Super GOV service' },
      name: serviceData.name || 'Super Duper service',
      gateway_account_ids: serviceData.gateway_account_ids || ['111'],
      custom_branding: serviceData.custom_branding || defaultCustomBranding
    }

    if (serviceData.organisationName) {
      data.merchant_details = {
        name: serviceData.organisationName,
        address_line1: serviceData.merchant_details.address_line1,
        address_line2: serviceData.merchant_details.address_line2,
        address_city: serviceData.merchant_details.address_city,
        address_postcode: serviceData.merchant_details.address_postcode,
        address_country: serviceData.merchant_details.address_country
      }
    }

    return data
  }
}
