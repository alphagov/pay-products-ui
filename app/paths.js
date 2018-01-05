'use strict'

const generateRoute = require('./utils/generate_route.js')

module.exports = {
  default: {
    index: '/'
  },
  pay: {
    product: '/pay/:productExternalId'
  },
  demoPayment: {
    complete: '/payment-complete/:paymentExternalId',
    success: '/successful',
    failure: '/failed'
  },
  adhocPayment: {
    howToPay: '/adhoc/how-to-pay/:productExternalId'
  },
  healthcheck: {
    path: '/healthcheck'
  },
  staticPaths: {
    naxsiError: '/request-denied'
  },
  generateRoute
}
