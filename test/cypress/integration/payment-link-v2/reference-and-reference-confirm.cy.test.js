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

        cy.get('[data-cy=back-link]')
          .should('have.attr', 'href', '/pay/a-product-id')
          .should('contain', 'Back')

        cy.get('[data-cy=label]').should('contain', 'Enter your invoice number')
        cy.get('[data-cy=button]').should('exist')
      })

      it('when an reference is entered that is too long, should display an error', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.get('[data-cy=input]').type('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.get('[data-cy=error-summary] h2').should('contain', 'There is a problem')

        cy.get('[data-cy=error-summary] a')
          .should('contain', 'Invoice number must be 50 characters or fewer')
          .should('have.attr', 'href', '#payment-reference')

        cy.get('[data-cy=error-message]').should('contain', 'Invoice number must be 50 characters or fewer')
      })

      it('when an reference is entered that looks like a card number, should go to the `reference confirm` page', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.get('[data-cy=input]')
          .clear()
          .type('4444333322221111', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.title().should('contain', 'Confirm your invoice number - A Product Name')
      })
    })

    describe('Reference confirm page', () => {
      it('should display the `reference confirm` page correctly', () => {
        Cypress.Cookies.preserveOnce('session')

        cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id/reference')
        cy.get('h1').should('contain', 'Confirm your invoice number')
        cy.get('[data-cy=reference]').should('contain', '4444333322221111')
        cy.get('[data-cy=button]').should('exist')
      })

      it('when no radio option is selected and the `Continue` button is clicked, should display an error', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.get('[data-cy=button]').click()

        cy.get('[data-cy=error-summary] a')
          .should('contain', 'Select yes if your invoice number is correct')
          .should('have.attr', 'href', '#confirm-reference')

        cy.get('[data-cy=error-message]').should('contain', 'Select yes if your invoice number is correct')
      })

      it('when `Yes` is selected and `Continue` is clicked, should then go to the amount page', () => {
        Cypress.Cookies.preserveOnce('session')
        cy.get('[data-cy=yes-radio]').click()
        cy.get('[data-cy=button]').click()

        cy.title().should('contain', 'Enter amount to pay - A Product Name')
      })
    })
  })
})
