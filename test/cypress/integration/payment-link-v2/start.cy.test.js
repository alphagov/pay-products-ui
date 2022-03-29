const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const organisationName = 'Royston Vasey Parish Council'
const productName = 'Pay for a parking permit'
const serviceName = 'Parking'
const referenceLabel = 'Vehicle registration number'

describe('The payment link start page', () => {
  describe('Product with organisation name and description', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          gateway_account_id: gatewayAccountId,
          name: productName,
          external_id: productExternalId,
          reference_enabled: true,
          reference_label: referenceLabel,
          description: 'Once payment is received your permit will be printed and posted to you. Please note that this can take up to 10 working days from receipt of payment.',
          type: 'ADHOC',
          new_payment_link_journey_enabled: true
        }),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId,
          serviceName: {
            en: serviceName
          },
          organisationName
        })
      ])
    })

    it('should render the start page', () => {
      cy.visit(`/pay/${productExternalId}`)

      cy.get('[data-cy=header-service-name]').should('contain', productName)
      cy.title().should('contain', `Make a payment - ${productName}`)
      cy.get('[data-cy=heading-caption]').should('have.text', organisationName)
      cy.get('h1').should('have.text', productName)
      cy.get('[data-cy=product-description]').should('contain', 'Once payment is received')
    })

    it('should continue to the reference page when continue is clicked', () => {
      cy.get('[data-cy=button]').click()
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/pay/${productExternalId}/reference`)
      })
      cy.get('[data-cy=label]').should('contain', `Please enter your ${referenceLabel}`)
    })
  })

  describe('The payment link has no organisation name', () => {
    it('should display the service name in the caption', () => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          gateway_account_id: gatewayAccountId,
          external_id: productExternalId,
          type: 'ADHOC',
          new_payment_link_journey_enabled: true
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
    it('should display the default description', () => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          gateway_account_id: gatewayAccountId,
          external_id: productExternalId,
          type: 'ADHOC',
          new_payment_link_journey_enabled: true,
          description: null
        }),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId
        })
      ])

      cy.visit(`/pay/${productExternalId}`)
      cy.get('[data-cy=product-description]').should('contain', 'Click continue to make a payment.')
    })
  })
})
