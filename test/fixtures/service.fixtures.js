'use strict'

module.exports = {
  validServiceResponse: (serviceData = {}) => {
    const defaultCustomBranding = { cssUrl: 'css url', imageUrl: 'image url' }

    return {
      external_id: serviceData.external_id || 'service-external-id',
      service_name: serviceData.service_name || { en: 'Super GOV service' },
      name: serviceData.name || 'Super Duper service',
      gateway_account_ids: serviceData.gateway_account_ids || ['111'],
      custom_branding: serviceData.custom_branding || defaultCustomBranding
    }
  }
}
