const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const serviceNamePath = 'a-service-name'
const productNamePath = 'a-product-name'

describe('Rebranding', () => {
  const productOpts = {
    gateway_account_id: gatewayAccountId,
    external_id: productExternalId,
    service_name_path: serviceNamePath,
    product_name_path: productNamePath,
    type: 'ADHOC',
    description: null
  }
  it('should display the header and footer with new branding when ENABLE_REBRAND = true', () => {
    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess({
        gatewayAccountId: gatewayAccountId
      })
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)

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
  })
})
