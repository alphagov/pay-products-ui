const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const organisationName = 'Swift Council'
const productName = 'Pay for a parking permit'
const serviceNamePath = 'a-service-name'
const productNamePath = 'a-product-name'

const productOpts = {
  gateway_account_id: gatewayAccountId,
  service_name_path: serviceNamePath,
  product_name_path: productNamePath,
  name: productName,
  external_id: productExternalId,
  description: 'Once payment is received your permit will be printed and posted to you. Please note that this can take up to 10 working days from receipt of payment.',
  type: 'ADHOC'
}

describe('The footer displayed on payment', () => {
  describe('Product with organisation name and description', () => {
    it('should display the service name, address and country when service has full organisation details', () => {
      const serviceOpts = {
        gatewayAccountId,
        organisationName,
        merchant_details: {
          name: organisationName,
          address_line1: '6 starling Street',
          address_line2: 'Borough',
          address_city: 'Swift',
          address_postcode: 'AW1H 9UX',
          address_country: 'GB'
        }
      }

      cy.task('setupStubs', [
        productStubs.getProductByPathStub(productOpts),
        productStubs.getProductByExternalIdStub(productOpts),
        serviceStubs.getServiceSuccess(serviceOpts)
      ])

      cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)

      cy.get('[data-cy=footer]')
        .should('have.css', 'background-color', 'rgb(244, 248, 251)')
        .should('have.css', 'border-top-color', 'rgb(29, 112, 184)')

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__inline-list .govuk-footer__link')
        .should('have.length', 4)
        .then(($elements) => {
          expect($elements.eq(0).text()).to.contain('Privacy notice')
          expect($elements.eq(1).text()).to.contain('reCAPTCHA notice')
          expect($elements.eq(2).text()).to.contain('Cookies')
          expect($elements.eq(3).text()).to.contain('Accessibility statement')
        })

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__inline-list .govuk-footer__link')
        .should('have.length', 4)
        .then(($elements) => {
          expect($elements.eq(0).text()).to.contain('Privacy notice')
          expect($elements.eq(1).text()).to.contain('reCAPTCHA notice')
          expect($elements.eq(2).text()).to.contain('Cookies')
          expect($elements.eq(3).text()).to.contain('Accessibility statement')
        })

      cy.get('[data-cy=footer]')
        .find('.govuk-footer__meta-custom')
        .should('contain', 'Service provided by Swift Council, 6 starling Street, Borough, Swift, AW1H 9UX, United Kingdom')
    })
  })

  it('should display the service name and address when service does not have a second address line', () => {
    const serviceOpts = {
      gatewayAccountId,
      organisationName,
      merchant_details: {
        name: organisationName,
        address_line1: '6 starling Street',
        address_city: 'Swift',
        address_postcode: 'AW1H 9UX',
        address_country: 'GB'
      }
    }

    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess(serviceOpts)
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)
    cy.get('[data-cy=footer]')
      .find('.govuk-footer__meta-custom')
      .should('contain', 'Service provided by Swift Council, 6 starling Street, Swift, AW1H 9UX, United Kingdom')
  })

  it('should not display the service details if there are no organisation for the service', () => {
    const serviceOpts = {
      merchant_details: null
    }

    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess(serviceOpts)
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)

    cy.get('[data-cy=footer]')
      .find('.govuk-footer__meta-custom')
      .should('not.exist')
  })

  it('should not display the service details if there is an organisation address but no organisation name', () => {
    const serviceOpts = {
      gatewayAccountId,
      merchant_details: {
        name: null,
        address_line1: '6 starling Street',
        address_line2: 'Borough',
        address_city: 'Swift',
        address_postcode: 'AW1H 9UX',
        address_country: 'GB'
      }
    }

    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess(serviceOpts)
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)

    cy.get('[data-cy=footer]')
      .find('.govuk-footer__meta-custom')
      .should('not.exist')
  })

  it('should display just the service namei and address when some address fields are missing', () => {
    const serviceOpts = {
      gatewayAccountId,
      organisationName,
      merchant_details: {
        name: organisationName,
        address_city: 'Swift',
        address_postcode: 'AW1H 9UX',
        address_country: 'GB'
      }
    }

    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess(serviceOpts)
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)
    cy.get('[data-cy=footer]')
      .find('.govuk-footer__meta-custom')
      .should('contain', 'Service provided by Swift Council, Swift, AW1H 9UX, United Kingdom')
  })
})
