const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const organisationName = 'Royston Vasey Parish Council'
const productName = 'Pay for a parking permit'
const serviceName = 'Parking'
const referenceLabel = 'Vehicle registration number'
const serviceNamePath = 'a-service-name'
const productNamePath = 'a-product-name'

describe('The payment link start page', () => {
  describe('Product with organisation name and description', () => {
    const productOpts = {
      gateway_account_id: gatewayAccountId,
      service_name_path: serviceNamePath,
      product_name_path: productNamePath,
      name: productName,
      external_id: productExternalId,
      reference_enabled: true,
      reference_label: referenceLabel,
      description: 'Once payment is received your permit will be printed and posted to you. Please note that this can take up to 10 working days from receipt of payment.',
      type: 'ADHOC'
    }

    beforeEach(() => {
      cy.task('setupStubs', [
        productStubs.getProductByPathStub(productOpts),
        productStubs.getProductByExternalIdStub(productOpts),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId,
          serviceName: {
            en: serviceName
          },
          organisationName,
          merchant_details: {
            name: organisationName
          }
        })
      ])
    })

    it('should render the start page', () => {
      cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)
      cy.title().should('contain', `Make a payment - ${productName}`)
      cy.get('[data-cy=heading-caption]').should('have.text', organisationName)
      cy.get('h1').should('have.text', productName)
      cy.get('[data-cy=product-description]').should('contain', 'Once payment is received')

      cy.log('Should display the GOV.UK header correctly')

      cy.get('[data-cy=header]').should('have.css', 'background-color', 'rgb(29, 112, 184)')
      cy.get('[data-cy=header]').should('have.css', 'color', 'rgb(255, 255, 255)')
      cy.get('[data-cy=header]')
        .find('.govuk-header__container')
        .should('have.css', 'border-bottom-color', 'rgb(255, 255, 255)')
      cy.get('[data-cy=header]')
        .find('.govuk-header__service-name')
        .should('contain', productName)
    })

    it('should continue to the reference page when continue is clicked', () => {
      cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)
      cy.get('[data-cy=button]').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/pay/${productExternalId}/reference`)
      })
      cy.get('[data-cy=label]').should('contain', `Enter your ${referenceLabel}`)
    })
  })

  describe('The payment link has no organisation name', () => {
    it('should display the service name in the caption', () => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          gateway_account_id: gatewayAccountId,
          external_id: productExternalId,
          type: 'ADHOC'
        }),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId,
          serviceName: {
            en: serviceName
          }
        })
      ])

      cy.visit(`/pay/${productExternalId}`)
      cy.get('[data-cy=heading-caption]').should('have.text', serviceName)
    })
  })

  describe('The payment link has no description', () => {
    const productOpts = {
      gateway_account_id: gatewayAccountId,
      external_id: productExternalId,
      service_name_path: serviceNamePath,
      product_name_path: productNamePath,
      type: 'ADHOC',
      description: null
    }
    it('should display the start page without a description', () => {
      cy.task('setupStubs', [
        productStubs.getProductByPathStub(productOpts),
        productStubs.getProductByExternalIdStub(productOpts),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId
        })
      ])

      cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)
      cy.get('[data-cy=product-description]').should('not.exist')
    })
  })
})
