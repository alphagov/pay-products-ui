'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

describe('Amount page', () => {
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

    it('should redirect to the `Amount` page', () => {
      cy.visit('/pay/a-product-id/amount')

      cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id/reference')
      cy.get('[data-cy=label]').should('contain', 'Enter amount to pay')
      cy.get('[data-cy=button]').should('exist')
    })

    it('when the amount is in the wrong format, should display an error', () => {
      cy.get('[data-cy=input]').type('invalid amount', { delay: 0 })
      cy.get('[data-cy=button]').click()

      cy.get('[data-cy=error-summary] a')
        .should('contain', 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
        .should('have.attr', 'href', '#payment-amount')

      cy.get('[data-cy=error-message]').should('contain', 'Enter an amount in pounds and pence using digits and a decimal point. For example “10.50”')
    })

    it('when a valid amount is entered, should then go to the `confirm` page', () => {
      cy.get('[data-cy=input]')
        .clear()
        .type('10.50', { delay: 0 })

      cy.get('[data-cy=button]').click()

      cy.title().should('contain', 'Confirm - A Product Name')
    })
  })
})
