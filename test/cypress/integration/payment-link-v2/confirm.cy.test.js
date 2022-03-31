'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

describe('Confirm page', () => {
  describe('when the product.price=1000', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        productStubs.getProductByExternalIdStub({
          external_id: productExternalId,
          reference_enabled: false,
          price: 1000
        }),
        serviceStubs.getServiceSuccess({
          gatewayAccountId: gatewayAccountId,
          serviceName: {
            en: 'Test service name'
          }
        })
      ])
    })

    it('should redirect to the `Confirm` page', () => {
      cy.visit('/pay/a-product-id/confirm')

      cy.get('[data-cy=product-name]').should('contain', 'A Product Name')

      cy.get('[data-cy=summary-list]').get('dt').eq(0).should('contain', 'Total to pay')
      cy.get('[data-cy=summary-list]').get('dd').eq(0).should('contain', '£10.00')
      cy.get('[data-cy=summary-list]').get('dd').eq(1).should('not.exist')

      cy.get('[data-cy=form]').get('#amount').eq(0).should('value', '1000')
    })

    it('should not display the `Change` amount link', () => {
      cy.get('[data-cy=summary-list]').get('dd').eq(1).should('not.exist')
    })
  })
})
