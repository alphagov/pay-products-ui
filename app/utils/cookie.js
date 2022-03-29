'use strict'

const session = require('client-sessions')
const _ = require('lodash')
const { COOKIE_MAX_AGE, SESSION_ENCRYPTION_KEY } = process.env
const SESSION_COOKIE_NAME = 'session'
const DISABLE_INTERNAL_HTTPS = process.env.DISABLE_INTERNAL_HTTPS === 'true'

function checkEnv () {
  if (!isValidStringKey(SESSION_ENCRYPTION_KEY)) {
    throw new Error('cookie encryption key is not set')
  }
  if (!isValidStringKey(COOKIE_MAX_AGE)) {
    throw new Error('cookie max age is not set')
  }
}

/**
 * @private
 *
 * @param {string} key
 * @returns {boolean}
 */
function isValidStringKey (key) {
  return !!key && typeof key === 'string'
}

function sessionCookie () {
  checkEnv()
  return session({
    cookieName: SESSION_COOKIE_NAME, // cookie name dictates the key name added to the request object
    secret: SESSION_ENCRYPTION_KEY,
    duration: parseInt(COOKIE_MAX_AGE), // how long the session will stay valid in ms
    proxy: true,
    cookie: {
      ephemeral: false, // when true, cookie expires when the browser closes
      httpOnly: true, // when true, cookie is not accessible from javascript
      secureProxy: !DISABLE_INTERNAL_HTTPS
    }
  })
}

/**
 * Sets session[key] = value for all valid sessions, based on existence of encryption key,
 * and the existence of relevant cookie on the request
 *
 * @param {Request} req
 * @param {string} key
 * @param {*} value
 */
function setSessionVariable (req, key, value) {
  if (SESSION_ENCRYPTION_KEY) {
    setValueOnCookie(req, key, value, SESSION_COOKIE_NAME)
  }
}

/**
 * Gets value of key from session, based on existence of encryption key
 *
 * @param {Request} req
 * @param {string} key
 * @returns {*}
 */
function getSessionVariable (req, key) {
  const session = _.get(req, getSessionCookieName())
  return session && session[key]
}

/**
 * Returns current 'active' cookie name based on
 * existing env vars. Favours `SESSION_ENCRYPTION_KEY`
 * over `SESSION_ENCRYPTION_KEY_2`
 *
 * @returns {string}
 */
function getSessionCookieName () {
  if (isValidStringKey(SESSION_ENCRYPTION_KEY)) {
    return SESSION_COOKIE_NAME
  }
}

/**
 * @private
 *
 * @param {object} req
 * @param {string} key
 * @param {*} value
 * @param {string} cookieName
 */
function setValueOnCookie (req, key, value, cookieName) {
  if (typeof _.get(req, `${cookieName}`) !== 'object') return
  _.set(req, `${cookieName}.${key}`, value)
}

module.exports = {
  sessionCookie,
  setSessionVariable,
  getSessionVariable,
  getSessionCookieName
}
