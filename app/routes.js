'use strict'

// Local Dependencies
const response = require('./utils/response.js').response
const generateRoute = require('./utils/generate_route')
const paths = require('./paths.js')
const CORRELATION_HEADER = require('./utils/correlation_header').CORRELATION_HEADER

// - Controllers
const staticCtrl = require('./controllers/static_controller')
const healthcheckCtrl = require('./controllers/healthcheck_controller')

// Assignments
const { healthcheck, staticPaths } = paths

// Exports
module.exports.generateRoute = generateRoute
module.exports.paths = paths

module.exports.bind = function (app) {
  app.get('/style-guide', (req, res) => response(req, res, 'style_guide'))

  // APPLY CORRELATION MIDDLEWARE
  app.use('*', (req, res, next) => {
    req.correlationId = req.headers[CORRELATION_HEADER] || ''
    next()
  })

  // HEALTHCHECK
  app.get(healthcheck.path, healthcheckCtrl.healthcheck)

  // STATIC
  app.all(staticPaths.naxsiError, staticCtrl.naxsiError)
}
