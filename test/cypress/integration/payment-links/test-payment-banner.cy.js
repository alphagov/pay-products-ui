const productStubs = require('../../stubs/products-stubs')
const paymentStubs = require('../../stubs/payment-stubs')
const serviceStubs = require('../../stubs/service-stubs')

const productOpts = {
  gateway_account_id: 42,
  name: 'Money pit deposit service',
  external_id: 'a-product-id',
  reference_enabled: true,
  reference_label: 'Amount of gold coins',
  description: 'For the billionaire who measures wealth not in GBP, but in depth',
  type: 'ADHOC'
}

const serviceOpts = {
  gatewayAccountId: 42,
  serviceName: {
    en: 'Money pit deposit service'
  }
}

const paymentOpts = {
  paymentExternalId: 'a-payment-id',
  productExternalId: 'a-product-id',
  amount: '10000000',
  govukStatus: 'success',
  referenceNumber: '1337'
}

describe('Live Payment Links', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      productStubs.getProductByExternalIdStub(
        {
          test_api_key: false,
          ...productOpts
        }),
      serviceStubs.getServiceSuccess(serviceOpts),
      paymentStubs.getPaymentByExternalId(paymentOpts)
    ])
  })

  it('should not display test payment warning banners on each pre-payment page', () => {
    cy.visit('/pay/a-product-id')
    checkBanners(false)
    cy.get('[data-cy="button"]').click()
    checkBanners(false)
    cy.get('input[name="payment-reference"]')
      .clear({ force: true })
      .type('1337')
    cy.get('[data-cy="button"]').click()
    checkBanners(false)
    cy.get('input[name="payment-amount"]')
      .clear({ force: true })
      .type('100000')
    cy.get('[data-cy="button"]').click()
    checkBanners(false)
    cy.visit('/payment-complete/a-payment-id')
    checkBanners(false)
  })
})

describe('Test Payment Links', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      productStubs.getProductByExternalIdStub(
        {
          test_api_key: true,
          ...productOpts
        }),
      serviceStubs.getServiceSuccess(serviceOpts),
      paymentStubs.getPaymentByExternalId(paymentOpts)
    ])
  })

  it('should display test payment warning banners on each pre-payment page', () => {
    cy.visit('/pay/a-product-id')
    checkBanners(true)
    cy.get('[data-cy="button"]').click()
    checkBanners(true)
    cy.get('input[name="payment-reference"]')
      .clear({ force: true })
      .type('1337')
    cy.get('[data-cy="button"]').click()
    checkBanners(true)
    cy.get('input[name="payment-amount"]')
      .clear({ force: true })
      .type('100000')
    cy.get('[data-cy="button"]').click()
    checkBanners(true)
    cy.visit('/payment-complete/a-payment-id')
    checkBanners(true)
  })
})

function checkBanners (exist) {
  if (exist) {
    cy.get('.govuk-phase-banner')
      .should('exist')
      .should('contain.text', 'This is a test payment service.')
    cy.get('.test-payment-banner')
      .should('exist')
      .should('contain.text', 'This is a test page. No money will be taken.')
  } else {
    cy.get('.govuk-phase-banner').should('not.exist')
    cy.get('.test-payment-banner').should('not.exist')
  }
}
