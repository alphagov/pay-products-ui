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

  it('should show an error page when the payment link is visited with the correct branding for the header and footer', () => {
    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}?amount=not-valid`, { failOnStatusCode: false })

    cy.log('Should display the header with new branding')

    cy.get('[data-cy=header]').should('have.css', 'background-color', 'rgb(29, 112, 184)')
    cy.get('[data-cy=header]').should('have.css', 'color', 'rgb(255, 255, 255)')
    cy.get('[data-cy=header]')
      .find('.govuk-header__container')
      .should('have.css', 'border-bottom-color', 'rgb(255, 255, 255)')

    cy.log('Should display the footer with new branding')

    cy.get('[data-cy=footer]')
      .should('have.css', 'background-color', 'rgb(244, 248, 251)')
      .should('have.css', 'border-top-color', 'rgb(29, 112, 184)')

    cy.get('h1').should('have.text', 'There is a problem')
    cy.get('[data-cy=error-message]').should('contain.text', 'There is a problem with the link you have been sent to use to pay. Please contact the service you are trying to make a payment to.')
  })
})
