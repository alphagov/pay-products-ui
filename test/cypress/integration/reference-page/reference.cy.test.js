'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

describe('Reference page', () => {
  describe('when the Payment Link has no price', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          external_id: productExternalId,
          reference_enabled: true,
          reference_label: 'invoice number',
          type: 'ADHOC'
        }),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId,
          serviceName: {
            en: 'Test service name'
          }
        })
      ])

      Cypress.Cookies.preserveOnce('session')
    })

    it('should redirect to the Reference page', () => {
      cy.visit('/pay/a-product-id/reference')

      cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id')
      cy.get('[data-cy=label]').should('contain', 'Please enter your invoice number')
      cy.get('[data-cy=button]').should('exist')
    })

    it('when no value entered, should display an error', () => {
      cy.get('[data-cy=button]').click()

      cy.get('[data-cy=error-summary] a').should('contain', 'Enter a valid invoice number')
      cy.get('[data-cy=error-summary] a').should('have.attr', 'href', '#payment-reference')
      cy.get('[data-cy=error-message]').should('contain', 'Enter a valid invoice number')
    })

    it('when an reference label is entered that is too long, should display an error', () => {
      cy.get('[data-cy=input]').type('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1')
      cy.get('[data-cy=button]').click()

      cy.get('[data-cy=error-summary] a').should('contain', 'Invoice number must be less than or equal to 50 characters')
      cy.get('[data-cy=error-summary] a').should('have.attr', 'href', '#payment-reference')
      cy.get('[data-cy=error-message]').should('contain', 'Invoice number must be less than or equal to 50 characters')
    })

    it('when an reference label is entered that contains invalid characters, should display an error', () => {
      cy.get('[data-cy=input]').clear()
      cy.get('[data-cy=input]').type('reference with invalid characters <>')
      cy.get('[data-cy=button]').click()

      cy.get('[data-cy=error-summary] a').should('contain', 'Invoice number can’t contain any of the following characters < > ; : ` ( ) " \' = | "," ~ [ ]')
      cy.get('[data-cy=error-summary] a').should('have.attr', 'href', '#payment-reference')
      cy.get('[data-cy=error-message]').should('contain', 'Invoice number can’t contain any of the following characters < > ; : ` ( ) " \' = | "," ~ [ ]')
    })

    it('when a valid label is entered, should then go to the amount page', () => {
      cy.visit('/pay/a-product-id/reference')
      cy.get('[data-cy=input]').clear()
      cy.get('[data-cy=input]').type('a-test-invoice-number')
      cy.get('[data-cy=button]').click()

      cy.title().should('contain', 'Enter amount to pay - A Product Name')
    })
  })
})
