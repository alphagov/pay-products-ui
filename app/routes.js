'use strict'

const express = require('express')
const {
  rateLimitMiddleware,
  requestParseMiddleware,
  detectErrorsMiddleware,
  captureEventMiddleware
} = require('@govuk-pay/pay-js-commons/lib/utils/middleware/csp')

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')
const logger = require('./utils/logger')(__filename)
const Sentry = require('./utils/sentry.js').initialiseSentry()

// - Controllers
const staticCtrl = require('./naxsi/static.controller')
const healthcheckCtrl = require('./healthcheck/healthcheck.controller')
const friendlyUrlRedirectCtrl = require('./product/friendly-url-redirect.controller')
const prePaymentCtrl = require('./payment/pre-payment.controller')
const completeCtrl = require('./payment/payment-complete.controller')
const failedCtrl = require('./demo-payment/payment-failed.controller')
const successCtrl = require('./demo-payment/payment-success.controller')
const amountCtrl = require('./payment-links/amount/amount.controller')
const referenceCtrl = require('./payment-links/reference/reference.controller')
const confirmCtrl = require('./payment-links/confirm/confirm.controller')

// Middleware
const { validateAndRefreshCsrf, ensureSessionHasCsrfSecret } = require('./middleware/csrf')
const resolveProduct = require('./middleware/resolve-product')
const resolvePaymentAndProduct = require('./middleware/resolve-payment-and-product')
const resolveLanguage = require('./middleware/resolve-language')
const { sendCspHeader } = require('../app/middleware/csp')

// Assignments
const { healthcheck, staticPaths, friendlyUrl, pay, demoPayment, paymentLinks } = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

const cspMiddlewareStack = [
  rateLimitMiddleware,
  requestParseMiddleware(50000, express),
  detectErrorsMiddleware(logger),
  captureEventMiddleware([
    'www.facebook.com',
    'spay.samsung.com'
  ], logger, Sentry)
]

module.exports.bind = function (app) {
  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // HEALTHCHECK
  app.get(healthcheck.path, sendCspHeader, healthcheckCtrl)

  // STATIC
  app.all(staticPaths.naxsiError, sendCspHeader, staticCtrl.naxsiError)

  // FRIENDLY URL
  app.get(friendlyUrl.redirect, friendlyUrlRedirectCtrl)

  // CREATE PAYMENT
  app.get(pay.product, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, prePaymentCtrl)

  // CREATE REFERENCE
  app.get(pay.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, prePaymentCtrl)

  // PAYMENT COMPLETE
  app.get(pay.complete, resolvePaymentAndProduct, resolveLanguage, sendCspHeader, completeCtrl)

  // DEMO SPECIFIC SCREENS
  app.get(demoPayment.failure, sendCspHeader, failedCtrl)
  app.get(demoPayment.success, sendCspHeader, successCtrl)

  // ADHOC AND AGENT_INITIATED_MOTO SPECIFIC SCREENS
  app.get(paymentLinks.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, referenceCtrl.getPage)
  app.post(paymentLinks.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, referenceCtrl.postPage)

  app.get(paymentLinks.amount, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, amountCtrl.getPage)
  app.post(paymentLinks.amount, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, amountCtrl.postPage)

  app.get(paymentLinks.confirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, confirmCtrl.getPage)
  app.post(paymentLinks.confirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, sendCspHeader, confirmCtrl.postPage)

  app.post(paths.csp.path, cspMiddlewareStack)

  // security.txt — https://gds-way.cloudapps.digital/standards/vulnerability-disclosure.html
  const securitytxt = 'https://vdp.cabinetoffice.gov.uk/.well-known/security.txt'
  app.get('/.well-known/security.txt', (req, res) => res.redirect(securitytxt))
  app.get('/security.txt', (req, res) => res.redirect(securitytxt))

  // route to gov.uk 404 page
  // this has to be the last route registered otherwise it will redirect other routes
  app.all('*', (req, res) => res.redirect('https://www.gov.uk/404'))
}
