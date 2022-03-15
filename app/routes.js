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
const adhocPaymentCtrl = require('./controllers/adhoc-payment')
const amountCtrl = require('./payment-link-v2/amount/amount.controller')
const productReferenceCtrl = require('./controllers/product-reference')
const referenceCtrl = require('./payment-link-v2/reference/reference.controller')
const referenceConfirmCtrl = require('./payment-link-v2/reference-confirm/reference-confirm.controller')
const confirmCtrl = require('./payment-link-v2/confirm/confirm.controller')

// Middleware
const { validateAndRefreshCsrf, ensureSessionHasCsrfSecret } = require('./middleware/csrf')
const resolveProduct = require('./middleware/resolve-product')
const resolvePaymentAndProduct = require('./middleware/resolve-payment-and-product')
const resolveLanguage = require('./middleware/resolve-language')
// - Middleware
const correlationId = require('./middleware/correlation-id')

// Assignments
const { healthcheck, staticPaths, friendlyUrl, pay, demoPayment, paymentLinksV2 } = paths

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
  app.post(pay.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, productReferenceCtrl.postReference)

  // PAYMENT COMPLETE
  app.get(pay.complete, resolvePaymentAndProduct, resolveLanguage, completeCtrl)

  // DEMO SPECIFIC SCREENS
  app.get(demoPayment.failure, failedCtrl)
  app.get(demoPayment.success, successCtrl)

  // ADHOC AND AGENT_INITIATED_MOTO SPECIFIC SCREENS
  app.post(pay.product, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, adhocPaymentCtrl.postIndex)

  app.get(paymentLinksV2.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceCtrl.getPage)
  app.post(paymentLinksV2.reference, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceCtrl.postPage)

  app.get(paymentLinksV2.referenceConfirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, referenceConfirmCtrl.getPage)

  app.get(paymentLinksV2.amount, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, amountCtrl.getPage)
  app.post(paymentLinksV2.amount, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, amountCtrl.postPage)

  app.get(paymentLinksV2.confirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, confirmCtrl.getPage)
  app.post(paymentLinksV2.confirm, ensureSessionHasCsrfSecret, validateAndRefreshCsrf, resolveProduct, resolveLanguage, confirmCtrl.postPage)

  // security.txt — https://gds-way.cloudapps.digital/standards/vulnerability-disclosure.html
  const securitytxt = 'https://vdp.cabinetoffice.gov.uk/.well-known/security.txt'
  app.get('/.well-known/security.txt', (req, res) => res.redirect(securitytxt))
  app.get('/security.txt', (req, res) => res.redirect(securitytxt))

  // route to gov.uk 404 page
  // this has to be the last route registered otherwise it will redirect other routes
  app.all('*', (req, res) => res.redirect('https://www.gov.uk/404'))
}
