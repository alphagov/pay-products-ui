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
        addressLine1: serviceData.merchant_details.addressLine1,
        addressLine2: serviceData.merchant_details.addressLine2,
        city: serviceData.merchant_details.city,
        postcode: serviceData.merchant_details.postcode,
        country: serviceData.merchant_details.country
      }
    }
    return data
  }
}
