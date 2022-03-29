'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

describe('Reference and reference confirm page', () => {
  describe('when the Payment Link has no price', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          external_id: productExternalId,
          reference_enabled: true,
          reference_label: 'invoice number',
          reference_hint: 'Invoice number hint',
          description: 'Product description',
          type: 'ADHOC'
        }),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId,
          serviceName: {
            en: 'Test service name'
          }
        })
      ])
    })

    describe('Reference page', () => {
      it('should redirect to the Reference page', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.visit('/pay/a-product-id/reference')

        cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id')
        cy.get('[data-cy=label]').should('contain', 'Please enter your invoice number')
        cy.get('[data-cy=button]').should('exist')
      })

      it('when an reference is entered that is too long, should display an error', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.get('[data-cy=input]').type('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.get('[data-cy=error-summary] a')
          .should('contain', 'Invoice number must be less than or equal to 50 characters')
          .should('have.attr', 'href', '#payment-reference')

        cy.get('[data-cy=error-message]').should('contain', 'Invoice number must be less than or equal to 50 characters')
      })

      it('when an reference is entered that looks like a card number, should go to the `reference confirm` page', () => {
        cy.get('[data-cy=input]')
          .clear()
          .type('4444333322221111', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.title().should('contain', 'Are you sure this is a reference number?')
      })
    })

    describe('Reference confirm page', () => {
      it('should display the `reference confirm` page correctly', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.get('[data-cy=product-name]').should('contain', 'A Product Name')
        cy.get('[data-cy=description]').should('contain', 'Product description')
        cy.get('[data-cy=reference-label]').should('contain', 'Invoice number')
        cy.get('[data-cy=reference-hint]').should('contain', 'Invoice number hint')
        cy.get('[data-cy=reference]').should('contain', '4444333322221111')

        cy.get('[data-cy=confirm-button]')
          .should('contain', 'Confirm and continue')
          .should('have.attr', 'href', '/pay/a-product-id/amount')

        cy.get('[data-cy=edit-button]')
          .should('contain', 'Edit')
          .should('have.attr', 'href', '/pay/a-product-id/reference')
      })

      it('when `click and confirm` is clicked, should then go to the amount page', () => {
        cy.get('[data-cy=confirm-button]').click()

        cy.title().should('contain', 'Enter amount to pay - A Product Name')
      })
    })
  })
})
