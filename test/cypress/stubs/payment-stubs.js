'use strict'

const { stubBuilder } = require('./stub-builder')

function createPaymentErrorStub (opts) {
  const path = `/v1/api/products/${opts.product_external_id}/payments`
  return stubBuilder('POST', path, 400, {
    response: {
      errors: [
        'Downstream system error.'
      ],
      error_identifier: 'CARD_NUMBER_IN_PAYMENT_LINK_REFERENCE_REJECTED'
    }
  })
}

function getPaymentByExternalId (opts) {
  const path = `/v1/api/payments/${opts.paymentExternalId}`
  return stubBuilder('GET', path, 200, {
    response: {
      external_id: opts.paymentExternalId,
      product_external_id: opts.productExternalId,
      amount: opts.amount,
      govuk_status: opts.govukStatus,
      reference_number: opts.referenceNumber,
      next_url: opts.nextUrl || '',
      _links: opts.links || []
    }
  })
}

module.exports = {
  createPaymentErrorStub,
  getPaymentByExternalId
}
