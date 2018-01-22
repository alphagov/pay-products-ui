'use strict'

// NPM dependencies
const express = require('express')
const sinon = require('sinon')

module.exports = {
  createAppWithSession,
  getMockSession
}

function createAppWithSession (app, sessionData = {}) {
  const proxyApp = express()
  proxyApp.all('*', (req, res, next) => {
    sessionData.destroy = sinon.stub()
    sessionData.csrfSecret = sessionData.csrfSecret || '123'
    req.session = sessionData || {}
    next()
  })
  proxyApp.use(app)
  return proxyApp
}

function getMockSession (opts = {}) {
  return {
    csrfSecret: opts.csrfSecret || '123'
  }
}
