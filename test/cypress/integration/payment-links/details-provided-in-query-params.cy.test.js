const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const productName = 'Pay for a green waste bin'
const serviceNamePath = 'a-service-name'
const productNamePath = 'a-product-name'

const productOpts = {
  gateway_account_id: gatewayAccountId,
  external_id: productExternalId,
  service_name_path: serviceNamePath,
  product_name_path: productNamePath,
  reference_enabled: true,
  reference_label: 'Council tax number',
  price: null,
  type: 'ADHOC',
  name: productName
}

describe('Payment link visited with amount and reference provided as query params', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess({
        gatewayAccountId: gatewayAccountId
      })
    ])
  })

  it('should show confirm page with details provided in the query params when "Continue" is clicked', () => {
    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}?amount=5689&reference=REF123`)
    cy.percySnapshot()

    cy.get('h1').should('have.text', productName)

    cy.get('[data-cy=button]').click()

    cy.location().should((location) => {
      expect(location.pathname).to.eq(`/pay/${productExternalId}/confirm`)
    })

    cy.get('[data-cy=summary-list]').within(() => {
      cy.get('.govuk-summary-list__row').eq(0).within(() => {
        cy.get('dt').should('contain', 'Council tax number')
        cy.get('dd').eq(0).should('contain', 'REF123')
        // should be no change link
        cy.get('dd').eq(1).should('not.exist')
      })
      cy.get('.govuk-summary-list__row').eq(1).within(() => {
        cy.get('dt').should('contain', 'Total to pay')
        cy.get('dd').eq(0).should('contain', '£56.89')
        // should be no change link
        cy.get('dd').eq(1).should('not.exist')
      })
    })

    cy.percySnapshot()
  })
})

describe('Payment link visited with invalid amount in query params', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess({
        gatewayAccountId: gatewayAccountId
      })
    ])
  })

  it('should show an error page when the payment link is visited', () => {
    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}?amount=not-valid`, { failOnStatusCode: false })
    cy.get('h1').should('have.text', 'An error occurred:')
    cy.get('[data-cy=error-message]').should('have.text', 'Please contact the service you are trying to make a payment to.')

    cy.percySnapshot()
  })
})

describe('Payment link visited with invalid reference in query params', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess({
        gatewayAccountId: gatewayAccountId
      })
    ])
  })

  it('should show an error page when the payment link is visited', () => {
    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}?reference=<>`, { failOnStatusCode: false })
    cy.get('h1').should('have.text', 'An error occurred:')
    cy.get('[data-cy=error-message]').should('have.text', 'Please contact the service you are trying to make a payment to.')

    cy.percySnapshot()
  })
})