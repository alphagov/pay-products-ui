'use strict'

const { translateAlpha2 } = require('@govuk-pay/pay-js-commons').utils.countries

/**
 * @class Service
 * @property {string} externalId - The external ID of the service
 * @property {string} name - The name of the service
 * @property {string} serviceName - The English and the Welsh (not required) name of the service
 * @property {array} gatewayAccountIds - An array containing the gateway ids {int} that belong to this service
 * @property {Object} customBranding -> An Object containing valuables for custom branding
 */
class Service {
  constructor (serviceData) {
    this.externalId = serviceData.external_id
    this.name = serviceData.name
    this.serviceName = serviceData.service_name
    this.gatewayAccountIds = serviceData.gateway_account_ids

    this.organisationName = serviceData.merchant_details && serviceData.merchant_details.name

    this.merchantDetails = serviceData.merchant_details
      ? {
          name: serviceData.merchant_details.name,
          addressLine1: serviceData.merchant_details.address_line1,
          addressLine2: serviceData.merchant_details.address_line2,
          city: serviceData.merchant_details.address_city,
          postcode: serviceData.merchant_details.address_postcode,
          countryName: serviceData.merchant_details.address_country ? translateAlpha2(serviceData.merchant_details.address_country) : undefined
        }
      : undefined

    this.customBranding =
      serviceData.custom_branding
        ? {
            cssUrl: serviceData.custom_branding.css_url,
            imageUrl: serviceData.custom_branding.image_url
          }
        : undefined
  }
}

module.exports = Service
