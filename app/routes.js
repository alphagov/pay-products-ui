'use strict'

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate_route')
const paths = require('./paths.js')

// - Controllers
const staticCtrl = require('./controllers/static_controller')
const healthcheckCtrl = require('./controllers/healthcheck_controller')
const makePaymentCtrl = require('./controllers/make_payment_controller')

// Middleware
const resolveProduct = require('./middleware/resolve_product')
// - Middleware
const correlationId = require('./middleware/correlation_id')

// Assignments
const { healthcheck, staticPaths, pay } = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', correlationId)

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckCtrl.healthcheck)

  // STATIC
  app.all(staticPaths.naxsiError, staticCtrl.naxsiError)

  app.get(pay.product, resolveProduct, makePaymentCtrl)
}
