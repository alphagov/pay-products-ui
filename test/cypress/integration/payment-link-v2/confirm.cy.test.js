'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

function checkReferenceRow (rowNumber) {
  const referenceSummaryElement = cy.get('[data-cy=summary-list] .govuk-summary-list__row').eq(rowNumber)
  referenceSummaryElement.get('dt').eq(0).should('contain', 'invoice number')
  referenceSummaryElement.get('dd').eq(0).should('contain', 'a-invoice-number')
  referenceSummaryElement.get('dd').eq(1).get('.govuk-link')
    .should('have.attr', 'href', '/pay/a-product-id/reference')
    .should('contain', 'Change')
}

function checkAmountRow (rowNumber, checkForChangeLink) {
  const amountSummaryElement = cy.get('.govuk-summary-list__row').eq(rowNumber)
  amountSummaryElement.should('contain', 'Total to pay')
  amountSummaryElement.should('contain', '£10.00')
}

describe.skip('Confirm page', () => {
  describe('when the product.price=1000', () => {
    describe('when there is no reference', () => {
      it('should display the `Confirm` page correctly', () => {
        cy.task('setupStubs', [
          productStubs.getProductByExternalIdStub({
            external_id: productExternalId,
            reference_enabled: false,
            type: 'ADHOC',
            price: 1000
          }),
          serviceStubs.getServiceSuccess({
            gatewayAccountId: gatewayAccountId,
            serviceName: {
              en: 'Test service name'
            }
          })
        ])

        cy.visit('/pay/a-product-id/confirm')

        cy.get('[data-cy=product-name]').should('contain', 'A Product Name')

        checkAmountRow(0, false)
      })

      it('should hide the `Change` amount link', () => {
        cy.get('[data-cy=summary-list]').eq(0).get('dd').eq(1).should('not.exist')
      })

      it('set the hidden form fields correctly', () => {
        cy.get('[data-cy=form]').get('#amount').eq(0).should('value', '1000')
      })
    })

    describe('when there is a reference', () => {
      it('should display the `Reference` page and allow a user to enter a reference', () => {
        cy.task('setupStubs', [
          productStubs.getProductByExternalIdStub({
            external_id: productExternalId,
            reference_enabled: true,
            reference_label: 'invoice number',
            reference_hint: 'Invoice number hint',
            type: 'ADHOC',
            price: 1000
          }),
          serviceStubs.getServiceSuccess({
            gatewayAccountId: gatewayAccountId,
            serviceName: {
              en: 'Test service name'
            }
          })
        ])

        cy.visit('/pay/a-product-id/reference')

        cy.get('[data-cy=label]').should('contain', 'Please enter your invoice number')

        cy.get('[data-cy=input]')
          .clear()
          .type('a-invoice-number', { delay: 0 })
        cy.get('[data-cy=button]').click()
      })

      it('should display the `Confirm` page correctly', () => {
        cy.get('[data-cy=product-name]').should('contain', 'A Product Name')

        checkReferenceRow(0)
        checkAmountRow(1, false)
      })

      it('should hide the `Change` amount link', () => {
        cy.get('[data-cy=summary-list]').eq(1).get('dd').eq(1).should('not.exist')
      })

      it('set the hidden form fields correctly', () => {
        cy.get('[data-cy=form]').get('#reference-value').eq(0).should('value', 'a-invoice-number')
        cy.get('[data-cy=form]').get('#amount').eq(0).should('value', '1000')
      })
    })
  })

  describe('when the product.price=null', () => {
    describe('when there is no reference', () => {
      it('should display the `Amount` page and allow a user to enter a amount', () => {
        cy.task('setupStubs', [
          productStubs.getProductByExternalIdStub({
            external_id: productExternalId,
            reference_enabled: false,
            type: 'ADHOC',
            price: null
          }),
          serviceStubs.getServiceSuccess({
            gatewayAccountId: gatewayAccountId,
            serviceName: {
              en: 'Test service name'
            }
          })
        ])

        cy.visit('/pay/a-product-id/amount')

        cy.get('[data-cy=label]').should('contain', 'Enter amount to pay')

        cy.get('[data-cy=input]')
          .clear()
          .type('10.50', { delay: 0 })
        cy.get('[data-cy=button]').click()
      })

      it('should display the `Change` amount link', () => {
        cy.get('[data-cy=summary-list]').eq(0).get('dd').eq(1).get('.govuk-link')
          .should('have.attr', 'href', '/pay/a-product-id/amount')
          .should('contain', 'Change')
      })

      it('set the hidden form fields correctly', () => {
        cy.get('[data-cy=form]').get('#amount').eq(0).should('value', '1050')
      })
    })

    describe('when there is a reference', () => {
      it('should display the `Amount` page and allow a user to enter a amount', () => {
        cy.task('setupStubs', [
          productStubs.getProductByExternalIdStub({
            external_id: productExternalId,
            reference_enabled: true,
            reference_label: 'invoice number',
            reference_hint: 'Invoice number hint',
            type: 'ADHOC',
            price: null
          }),
          serviceStubs.getServiceSuccess({
            gatewayAccountId: gatewayAccountId,
            serviceName: {
              en: 'Test service name'
            }
          })
        ])

        cy.visit('/pay/a-product-id/reference')

        cy.get('[data-cy=label]').should('contain', 'Please enter your invoice number')

        cy.get('[data-cy=input]')
          .clear()
          .type('a-invoice-number', { delay: 0 })
        cy.get('[data-cy=button]').click()
      })
    })
  })
})
