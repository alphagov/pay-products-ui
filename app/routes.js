'use strict'

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate-route')
const paths = require('./paths.js')

// - Controllers
const staticCtrl = require('./controllers/static.controller')
const healthcheckCtrl = require('./controllers/healthcheck.controller')
const friendlyUrlRedirectCtrl = require('./controllers/friendly-url-redirect.controller')
const prePaymentCtrl = require('./controllers/pre-payment.controller')
const completeCtrl = require('./controllers/payment-complete.controller')
const failedCtrl = require('./controllers/demo-payment/payment-failed.controller')
const successCtrl = require('./controllers/demo-payment/payment-success.controller')
const amountCtrl = require('./payment-links/amount/amount.controller')
const referenceCtrl = require('./payment-links/reference/reference.controller')
const referenceConfirmCtrl = require('./payment-links/reference-confirm/reference-confirm.controller')
const confirmCtrl = require('./payment-links/confirm/confirm.controller')

// Middleware
const { validateAndRefreshCsrf, ensureSessionHasCsrfSecret } = require('./middleware/csrf')
const resolveProduct = require('./middleware/resolve-product')
const resolvePaymentAndProduct = require('./middleware/resolve-payment-and-product')
const resolveLanguage = require('./middleware/resolve-language')
// - Middleware
const correlationId = require('./middleware/correlation-id')

// Assignments
const { healthcheck, staticPaths, friendlyUrl, pay, demoPayment, paymentLinks } = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationId)

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckCtrl)

  // STATIC
  app.all(staticPaths.naxsiError, staticCtrl.naxsiError)

  // FRIENDLY URL
  app.get(friendlyUrl.redirect, friendlyUrlRedirectCtrl)

  // CREATE PAYMENT
  app.get(pay.product, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, prePaymentCtrl)

  // CREATE REFERENCE
  app.get(pay.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, prePaymentCtrl)

  // PAYMENT COMPLETE
  app.get(pay.complete, resolvePaymentAndProduct, resolveLanguage, completeCtrl)

  // DEMO SPECIFIC SCREENS
  app.get(demoPayment.failure, failedCtrl)
  app.get(demoPayment.success, successCtrl)

  // ADHOC AND AGENT_INITIATED_MOTO SPECIFIC SCREENS
  app.get(paymentLinks.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceCtrl.getPage)
  app.post(paymentLinks.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceCtrl.postPage)

  app.get(paymentLinks.referenceConfirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceConfirmCtrl.getPage)
  app.post(paymentLinks.referenceConfirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceConfirmCtrl.postPage)

  app.get(paymentLinks.amount, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, amountCtrl.getPage)
  app.post(paymentLinks.amount, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, amountCtrl.postPage)

  app.get(paymentLinks.confirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, confirmCtrl.getPage)
  app.post(paymentLinks.confirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, confirmCtrl.postPage)

  // security.txt — https://gds-way.cloudapps.digital/standards/vulnerability-disclosure.html
  const securitytxt = 'https://vdp.cabinetoffice.gov.uk/.well-known/security.txt'
  app.get('/.well-known/security.txt', (req, res) => res.redirect(securitytxt))
  app.get('/security.txt', (req, res) => res.redirect(securitytxt))

  // route to gov.uk 404 page
  // this has to be the last route registered otherwise it will redirect other routes
  app.all('*', (req, res) => res.redirect('https://www.gov.uk/404'))
}
