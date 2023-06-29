'use strict'

const productStubs = require('../../stubs/products-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const gatewayAccountId = 666
const productExternalId = 'a-product-id'

const SUMMARY_LIST_ROW_SELECTOR = '[data-cy=summary-list] .govuk-summary-list__row'

function checkNumberOfRows (expectedNumberOfRows) {
  cy.get(SUMMARY_LIST_ROW_SELECTOR).should('have.length', expectedNumberOfRows)
}

function checkReferenceRow (rowNumber, shouldExist) {
  const referenceSummaryElement = cy.get(SUMMARY_LIST_ROW_SELECTOR).eq(rowNumber)

  referenceSummaryElement.within(() => {
    cy.get('dt').eq(0).should('contain', 'invoice number')
    cy.get('dd').eq(0).should('contain', 'a-invoice-number')
    cy.get('dd').eq(1).get('.govuk-link')
      .should('have.attr', 'href', '/pay/a-product-id/reference?change=true')
      .should('contain', 'Change')
  })
}

function checkAmountRow (rowNumber, shouldExist) {
  const amountSummaryElement = cy.get(SUMMARY_LIST_ROW_SELECTOR).eq(rowNumber)

  amountSummaryElement.within(() => {
    cy.get('dt').eq(0).should('contain', 'Total to pay')
    cy.get('dd').eq(0).should('contain', '£10.00')
  })
}

function checkChangeAmountLink (rowNumber, shouldExist) {
  const changeAmountLink = cy.get(SUMMARY_LIST_ROW_SELECTOR).eq(rowNumber)

  if (shouldExist) {
    changeAmountLink.within(() => {
      cy.get('dd').eq(1).get('.govuk-link')
        .should('have.attr', 'href', '/pay/a-product-id/amount?change=true')
        .should('contain', 'Change')
    })
  } else {
    changeAmountLink.within(() => {
      cy.get('dd').eq(1).should('not.exist')
    })
  }
}

describe('Confirm page', () => {
  describe('when the product.price=1000', () => {
    describe('when there is no reference', () => {
      it('should display the Confirm page with the amount row and no `Change` amount link', () => {
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
        cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id')

        checkNumberOfRows(1)
        checkAmountRow(0)

        checkChangeAmountLink(0, false)

        cy.get('[data-cy=form]').get('#reference-value').should('not.exist')
        cy.get('[data-cy=form]').get('#amount').should('value', '1000')
        cy.get('[data-cy=continue-to-payment-button]').should('exist')
      })
    })

    describe('when there is a reference', () => {
      it('should display the Confirm page with the reference row and the amount row with no `Change` amount link', () => {
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

        // Visit the reference page - to enter a reference
        cy.visit('/pay/a-product-id/reference')

        cy.get('[data-cy=label]').should('contain', 'Enter your invoice number')

        cy.get('[data-cy=input]')
          .clear()
          .type('a-invoice-number', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.url().should('include', '/pay/a-product-id/confirm')

        cy.get('[data-cy=product-name]').should('contain', 'A Product Name')

        checkNumberOfRows(2)
        checkReferenceRow(0, true)
        checkAmountRow(1, true)

        checkChangeAmountLink(1, false)

        cy.get('[data-cy=form]').get('#reference-value').eq(0).should('value', 'a-invoice-number')
        cy.get('[data-cy=form]').get('#amount').eq(0).should('value', '1000')
      })
    })

    describe('when product.require_captcha=true', () => {
      it('should display the Confirm page with the recaptcha field', () => {
        cy.task('setupStubs', [
          productStubs.getProductByExternalIdStub({
            external_id: productExternalId,
            type: 'ADHOC',
            price: 1000,
            require_captcha: true
          }),
          serviceStubs.getServiceSuccess({
            gatewayAccountId: gatewayAccountId,
            serviceName: {
              en: 'Test service name'
            }
          })
        ])

        cy.visit('/pay/a-product-id/confirm')

        cy.get('.g-recaptcha').should('exist')
      })
    })

    describe('when there is product.require_captcha=false', () => {
      it('should display the Confirm page with NO recaptcha field', () => {
        cy.task('setupStubs', [
          productStubs.getProductByExternalIdStub({
            external_id: productExternalId,
            type: 'ADHOC',
            price: 1000,
            require_captcha: false
          }),
          serviceStubs.getServiceSuccess({
            gatewayAccountId: gatewayAccountId,
            serviceName: {
              en: 'Test service name'
            }
          })
        ])

        cy.visit('/pay/a-product-id/confirm')

        cy.get('.g-recaptcha').should('not.exist')
      })
    })
  })

  describe('when the product.price=null', () => {
    describe('when there is no reference', () => {
      it('should display the Confirm page with no reference row and an amount row with no `Change` amount link', () => {
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

        // Visit the amount page - to enter an amount
        cy.visit('/pay/a-product-id/amount')

        cy.get('[data-cy=label]').should('contain', 'Enter amount to pay')

        cy.get('[data-cy=input]')
          .clear()
          .type('10.00', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.url().should('include', '/pay/a-product-id/confirm')

        cy.get('[data-cy=product-name]').should('contain', 'A Product Name')
        cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id/amount')

        checkNumberOfRows(1)
        checkAmountRow(0, true)

        checkChangeAmountLink(0, true)

        cy.get('[data-cy=form]').get('#reference-value').should('not.exist')
        cy.get('[data-cy=form]').get('#amount').should('value', '1000')
      })
    })

    describe('when there is a reference', () => {
      it('should display the Confirm page with a reference row and an amount row with the `Change` amount link', () => {
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

        // Visit the reference page - to enter a reference
        cy.visit('/pay/a-product-id/reference')

        cy.get('[data-cy=label]').should('contain', 'Enter your invoice number')

        cy.get('[data-cy=input]')
          .clear()
          .type('a-invoice-number', { delay: 0 })
        cy.get('[data-cy=button]').click()

        // Visit the amount page - to enter an amount
        cy.url().should('include', '/pay/a-product-id/amount')

        cy.get('[data-cy=label]').should('contain', 'Enter amount to pay')

        cy.get('[data-cy=input]')
          .clear()
          .type('10.00', { delay: 0 })
        cy.get('[data-cy=button]').click()

        cy.url().should('include', '/pay/a-product-id/confirm')

        cy.get('[data-cy=product-name]').should('contain', 'A Product Name')
        cy.get('[data-cy=back-link]').should('have.attr', 'href', '/pay/a-product-id/amount')

        checkNumberOfRows(2)
        checkReferenceRow(0, true)
        checkAmountRow(1, true)

        checkChangeAmountLink(1, true)

        cy.get('[data-cy=form]').get('#reference-value').should('value', 'a-invoice-number')
        cy.get('[data-cy=form]').get('#amount').should('value', '1000')
      })
    })
  })
})
