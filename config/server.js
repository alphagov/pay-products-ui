// Node.js core dependencies
const path = require('path')

// NPM dependencies
const express = require('express')
const metrics = require('@govuk-pay/pay-js-metrics')
const nunjucks = require('nunjucks')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const argv = require('minimist')(process.argv.slice(2))
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const staticify = require('staticify')(path.join(__dirname, '../public'))
const i18n = require('i18n')
const i18nPayTranslation = require('./pay-translation')

exports.staticify = staticify

// Custom dependencies
const router = require('../app/routes')
const noCache = require('../app/utils/no-cache')
const errorHandler = require('../app/middleware/error-handler')
const middlewareUtils = require('../app/utils/middleware')
const cookieUtil = require('../app/utils/cookie')
const i18nConfig = require('./i18n')
const logger = require('../app/utils/logger')(__filename)
const loggingMiddleware = require('../app/middleware/logging-middleware')
const { requestContextMiddleware } = require('../app/clients/base/request-context')
const Sentry = require('../app/utils/sentry.js').initialiseSentry()
const replaceParamsInPath = require('../app/utils/replace-params-in-path')

// Global constants
const JAVASCRIPT_PATH = staticify.getVersionedPath('/js/application.min.js')
const BIND_HOST = process.env.BIND_HOST || "127.0.0.1"
const PORT = process.env.PORT || 3000
const { NODE_ENV } = process.env
const unconfiguredApp = express()
const { ANALYTICS_TRACKING_ID } = process.env || ''

function warnIfAnalyticsNotSet () {
  if (ANALYTICS_TRACKING_ID === '') {
    logger.warn('Google Analytics Tracking ID [ANALYTICS_TRACKING_ID] is not set')
  }
}
// Define app views
const APP_VIEWS = [
  path.join(__dirname, '../node_modules/govuk-frontend/dist'),
  path.join(__dirname, '../app/views'),
  path.join(__dirname, '../app/payment-links'),
  path.join(__dirname, '../app/demo-payment'),
  path.join(__dirname, '../app/payment')
]

function initialiseGlobalMiddleware (app) {
  app.use(cookieParser())
  app.use(requestContextMiddleware)
  logger.stream = {
    write: function (message) {
      logger.info(message)
    }
  }
  if (process.env.DISABLE_REQUEST_LOGGING !== 'true') {
    app.use(/\/((?!public|favicon.ico).)*/, loggingMiddleware())
  }
  app.use(favicon(path.join(__dirname, '../node_modules/govuk-frontend/dist/govuk/assets/images', 'favicon.ico')))
  app.use(staticify.middleware)

  app.use(function (req, res, next) {
    res.locals.asset_path = '/public/'
    res.locals.routes = router.paths
    res.locals.analyticsTrackingId = ANALYTICS_TRACKING_ID
    res.locals.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION = process.env.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION === 'true'
    res.locals.GOOGLE_RECAPTCHA_SITE_KEY = process.env.GOOGLE_RECAPTCHA_SITE_KEY
    res.locals.replaceParamsInPath = replaceParamsInPath
    noCache(res)
    next()
  })
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
}

function initialiseTemplateEngine (app) {
  // Configure nunjucks
  // see https://mozilla.github.io/nunjucks/api.html#configure
  const nunjucksConfiguration = {
    express: app, // the express app that nunjucks should install to
    autoescape: true, // controls if output with dangerous characters are escaped automatically
    throwOnUndefined: false, // throw errors when outputting a null/undefined value
    trimBlocks: true, // automatically remove trailing newlines from a block/tag
    lstripBlocks: true, // automatically remove leading whitespace from a block/tag
    watch: false, // reload templates when they are changed (server-side). To use watch, make sure optional dependency chokidar is installed
    noCache: false // never use a cache and recompile templates each time (server-side)
  }
  if ((!NODE_ENV) || (NODE_ENV !== 'production')) {
    nunjucksConfiguration.watch = true
    nunjucksConfiguration.noCache = true
  }

  // Initialise nunjucks environment
  const nunjucksEnvironment = nunjucks.configure(APP_VIEWS, nunjucksConfiguration)

  // Set view engine
  app.set('view engine', 'njk')

  // Version static assets on production for better caching
  // if it's not production we want to re-evaluate the assets on each file change
  nunjucksEnvironment.addGlobal('css_path', staticify.getVersionedPath('/stylesheets/application.min.css'))
  nunjucksEnvironment.addGlobal('js_path', NODE_ENV === 'production' ? JAVASCRIPT_PATH : staticify.getVersionedPath('/js/application.js'))
}

function initialisePublic (app) {
  app.use('/public', express.static(path.join(__dirname, '../public')))
  app.use('/public', express.static(path.join(__dirname, '../node_modules/@govuk-pay/pay-js-commons/')))
  app.use('/', express.static(path.join(__dirname, '../node_modules/govuk-frontend/dist/govuk/')))
}

function initialisei18n (app) {
  i18n.configure(i18nConfig)
  app.use(i18n.init)
  app.use(i18nPayTranslation)
}

function initialiseRoutes (app) {
  router.bind(app)
}

function initialiseTLS () {
  if (process.env.DISABLE_INTERNAL_HTTPS === 'true') {
    logger.warn('DISABLE_INTERNAL_HTTPS is set.')
  }
}

function initialiseErrorHandling (app) {
  app.use(errorHandler)
}

function initialiseCookies (app) {
  app.use(middlewareUtils.excludingPaths(['/healthcheck'], cookieUtil.sessionCookie()))
}

function listen () {
  const app = initialise()
  app.listen(PORT, BIND_HOST)
  logger.info(`Listening on ${BIND_HOST}:${PORT}`)
}

/**
 * Configures app
 * @return app
 */
function initialise () {
  const app = unconfiguredApp
  if (NODE_ENV !== 'test') {
    app.use(metrics.initialise())
  }
  app.disable('x-powered-by')
  app.use(Sentry.Handlers.requestHandler())
  initialiseTLS()
  initialiseCookies(app)
  initialiseGlobalMiddleware(app)
  initialisei18n(app)

  app.use(flash())
  initialiseTemplateEngine(app)
  initialisePublic(app)
  initialiseRoutes(app) // This contains the 404 override and so should be last
  app.use(Sentry.Handlers.errorHandler())
  initialiseErrorHandling(app)
  warnIfAnalyticsNotSet()

  return app
}

/**
 * Starts app after ensuring DB is up
 */
function start () {
  listen()
}

// immediately invoke start if -i flag set. Allows script to be run by task runner
if (argv.i) {
  start()
}

exports.start = start
exports.getApp = initialise
