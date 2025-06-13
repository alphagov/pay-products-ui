const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 42
const productExternalId = 'a-product-id'
const serviceNamePath = 'a-service-name'
const productNamePath = 'a-product-name'

describe('Custom branding on the start page', () => {
  const productOpts = {
    gateway_account_id: gatewayAccountId,
    external_id: productExternalId,
    service_name_path: serviceNamePath,
    product_name_path: productNamePath,
    type: 'ADHOC',
    description: null
  }
  it('should display the start page correctly when custom branding contains a white background', () => {
    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess({
        gatewayAccountId: gatewayAccountId,
        customBranding: {
          imageUrl: '/public/images/custom/cypress-testing.svg',
          cssUrl: '/public/stylesheets/custom/cypress-testing-white-background.min.css'
        }
      })
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)

    cy.get('[data-cy=header]').should('have.css', 'background-color', 'rgb(255, 255, 255)')
    cy.get('[data-cy=header-container]').should('have.css', 'border-bottom-color', 'rgb(0, 0, 0)')

    cy.get('[data-cy=header-container]')
      .should('have.css', 'border-bottom-color', 'rgb(0, 0, 0)')
      .and('have.css', 'border-bottom-width')
      .then((borderWidth) => {
        expect(borderWidth).not.to.eq('0px')
      })

    cy.get('[data-cy=service-name]').should('have.css', 'color', 'rgb(0, 0, 0)')
    cy.get('[data-cy=custom-branding-image-container]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get('[data-cy=custom-branding-image]').should('have.attr', 'src', '/public/images/custom/cypress-testing.svg')
  })

  it('should display the start page correctly when custom branding contains a purple background', () => {
    cy.task('setupStubs', [
      productStubs.getProductByPathStub(productOpts),
      productStubs.getProductByExternalIdStub(productOpts),
      serviceStubs.getServiceSuccess({
        gatewayAccountId: gatewayAccountId,
        customBranding: {
          imageUrl: '/public/images/custom/cypress-testing.svg',
          cssUrl: '/public/stylesheets/custom/cypress-testing-purple-background.min.css'
        }
      })
    ])

    cy.visit(`/redirect/${serviceNamePath}/${productNamePath}`)

    cy.get('[data-cy=header]').should('have.css', 'background-color', 'rgb(191, 64, 191)')
    cy.get('[data-cy=header-container]').should('have.css', 'border-bottom-color', 'rgb(0, 0, 0)')

    cy.get('[data-cy=header-container]')
      .should('have.css', 'border-bottom-color', 'rgb(0, 0, 0)')
      .and('have.css', 'border-bottom-width')
      .then((borderWidth) => {
        expect(borderWidth).not.to.eq('0px')
      })

    cy.get('[data-cy=service-name]').should('have.css', 'color', 'rgb(255, 255, 255)')
    cy.get('[data-cy=custom-branding-image-container]').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    cy.get('[data-cy=custom-branding-image]').should('have.attr', 'src', '/public/images/custom/cypress-testing.svg')
  })
})
