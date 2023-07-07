'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

const textThatIs256CharactersLong = 'This is a piece of text that contains exactly 256 characters and this is 1 higher ' +
  'than 255 characters and as such it will fail any validation that checks if the text has a length of 255 ' +
  'characters or fewer because it is exactly 1 character longer than that'

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
        cy.visit('/pay/a-product-id/reference')

        cy.get('[data-cy=back-link]')
          .should('have.attr', 'href', '/pay/a-product-id')
          .should('contain', 'Back')

        cy.get('[data-cy=label]').should('contain', 'Enter your invoice number')
        cy.get('[data-cy=button]').should('exist')
      })

      it('when an reference is entered that is too long, should display an error', () => {
        cy.visit('/pay/a-product-id/reference')
        cy.get('[data-cy=input]').type(textThatIs256CharactersLong, { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.get('[data-cy=error-summary] h2').should('contain', 'There is a problem')

        cy.get('[data-cy=error-summary] a')
          .should('contain', 'Invoice number must be 255 characters or fewer')
          .should('have.attr', 'href', '#payment-reference')

        cy.get('[data-cy=error-message]').should('contain', 'Invoice number must be 255 characters or fewer')
      })
    })
  })
})
