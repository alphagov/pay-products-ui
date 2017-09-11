'use strict'

const responseHandler = require('../utils/response.js')

module.exports.healthcheck = function (req, res) {
  let data = {'ping': {'healthy': true}}
  responseHandler.healthCheckResponse(req, res, data)
}
