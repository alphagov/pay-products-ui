'use strict'

const logger = require('../utils/logger')(__filename)

// Constants
const errorMessagePath = 'error.internal' // This is the object notation to string in en.json

module.exports.naxsiError = function (req, res) {
  res.status(400)
  logger.info('NAXSI ERROR:- ' + req.headers['x-naxsi_sig'])
  res.render('error', { message: errorMessagePath })
}
