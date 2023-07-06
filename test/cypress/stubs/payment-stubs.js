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

module.exports = {
  createPaymentErrorStub
}
