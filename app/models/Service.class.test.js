'use strict'

// NPM dependencies
const expect = require('chai').expect

// Local dependencies
const Service = require('./Service.class')
const serviceFixtures = require('../../test/fixtures/service.fixtures')

describe('Service model from service raw data', () => {
  it('should save merchant details correctly in the service model', () => {
    const serviceModel = new Service(serviceFixtures.validServiceResponse({
      organisationName: 'Give Me Your Money',
      merchant_details: {
        address_line1: 'Clive House',
        address_line2: '10 Downing Street',
        address_city: 'London',
        address_postcode: 'AW1H 9UX',
        address_country: 'GB'
      }
    }))

    expect(serviceModel.organisationName).to.equal('Give Me Your Money')
    expect(serviceModel.merchantDetails.name).to.equal('Give Me Your Money')
    expect(serviceModel.merchantDetails.addressLine1).to.equal('Clive House')
    expect(serviceModel.merchantDetails.addressLine2).to.equal('10 Downing Street')
    expect(serviceModel.merchantDetails.city).to.equal('London')
    expect(serviceModel.merchantDetails.postcode).to.equal('AW1H 9UX')
    expect(serviceModel.merchantDetails.countryName).to.equal('United Kingdom')
  })

  it('when the country code is invalid then it should return undefined', () => {
    const serviceModel = new Service(serviceFixtures.validServiceResponse({
      organisationName: 'Give Me Your Money',
      merchant_details: {
        address_line1: 'Clive House',
        address_line2: '10 Downing Street',
        address_city: 'London',
        address_postcode: 'AW1H 9UX',
        address_country: 'ZZ' // ZZ is guaranteed to never be used as a country code
      }
    }))

    expect(serviceModel.merchantDetails.countryName).to.equal(undefined)
  })

  it('when the country code is empty then it should return undefined', () => {
    const serviceModel = new Service(serviceFixtures.validServiceResponse({
      organisationName: 'Give Me Your Money',
      merchant_details: {
        address_line1: 'Clive House',
        address_line2: '10 Downing Street',
        address_city: 'London',
        address_postcode: 'AW1H 9UX'
      }
    }))

    expect(serviceModel.merchantDetails.countryName).to.equal(undefined)
  })

  it('should return merchant details as undefined when not in raw data', () => {
    const data = {
      external_id: '1234',
      name: 'service name',
      gateway_account_ids: [1],
      custom_branding: { css_url: 'css url', image_url: 'image url' }
    }

    const serviceModel = new Service(data)

    expect(serviceModel.merchantDetails).to.equal(undefined)
  })
})
