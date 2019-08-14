// Node.js core dependencies
const path = require('path')

// Please leave here even though it looks unused - this enables Node.js metrics to be pushed to Hosted Graphite
if (process.env.DISABLE_APPMETRICS !== 'true') {
  require('./app/utils/metrics.js').metrics()
}

// NPM dependencies
const express = require('express')
const nunjucks = require('nunjucks')
const favicon = require('serve-favicon')
const bodyParser = require('body-parser')
const logger = require('winston')
const loggingMiddleware = require('morgan')
const argv = require('minimist')(process.argv.slice(2))
const flash = require('connect-flash')
const cookieParser = require('cookie-parser')
const staticify = require('staticify')(path.join(__dirname, 'public'))
const i18n = require('i18n')
const i18nPayTranslation = require('./config/pay-translation')

exports.staticify = staticify

// Custom dependencies
const router = require('./app/routes')
const noCache = require('./app/utils/no_cache')
const errorHandler = require('./app/middleware/error_handler')
const middlewareUtils = require('./app/utils/middleware')
const cookieUtil = require('./app/utils/cookie')
const i18nConfig = require('./config/i18n')

// Global constants
const JAVASCRIPT_PATH = staticify.getVersionedPath('/js/application.min.js')
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
  path.join(__dirname, 'node_modules/govuk-frontend/'),
  path.join(__dirname, '/app/views')
]

function initialiseGlobalMiddleware (app) {
  app.use(cookieParser())
  logger.stream = {
    write: function (message) {
      logger.info(message)
    }
  }
  if (process.env.DISABLE_REQUEST_LOGGING !== 'true') {
    app.use(/\/((?!public|favicon.ico).)*/, loggingMiddleware(
      ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - total time :response-time ms'))
  }
  app.use(favicon(path.join(__dirname, '/node_modules/govuk-frontend/govuk/assets/images', 'favicon.ico')))
  app.use(staticify.middleware)

  app.use(function (req, res, next) {
    res.locals.asset_path = '/public/'
    res.locals.routes = router.paths
    res.locals.analyticsTrackingId = ANALYTICS_TRACKING_ID
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
  app.use('/public', express.static(path.join(__dirname, '/public')))
  app.use('/public', express.static(path.join(__dirname, '/node_modules/@govuk-pay/pay-js-commons/')))
  app.use('/', express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk/')))
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
  app.listen(PORT)
  logger.log('Listening on port ' + PORT)
}

/**
 * Configures app
 * @return app
 */
function initialise () {
  const app = unconfiguredApp
  app.disable('x-powered-by')
  initialiseTLS()
  initialiseCookies(app)
  initialiseGlobalMiddleware(app)
  initialisei18n(app)

  app.use(flash())
  initialiseTemplateEngine(app)
  initialisePublic(app)
  initialiseErrorHandling(app)
  initialiseRoutes(app) // This contains the 404 override and so should be last
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
