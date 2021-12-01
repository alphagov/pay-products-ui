'use strict'

const generateRoute = require('./utils/generate-route.js')

module.exports = {
  default: {
    index: '/'
  },
  friendlyUrl: {
    redirect: '/redirect/:serviceNamePath/:productNamePath'
  },
  pay: {
    product: '/pay/:productExternalId',
    complete: '/payment-complete/:paymentExternalId',
    reference: '/pay/reference/:productExternalId'
  },
  paymentLinksV2: {
    product: '/pay/:productExternalId',
    amount: '/pay/:productExternalId/amount',
    reference: '/pay/:productExternalId/reference',
    confirm: '/pay/:productExternalId/confirm'
  },
  demoPayment: {
    success: '/successful',
    failure: '/failed'
  },
  healthcheck: {
    path: '/healthcheck'
  },
  staticPaths: {
    naxsiError: '/request-denied'
  },
  generateRoute
}
