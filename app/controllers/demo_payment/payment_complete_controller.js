'use strict'

// NPM dependencies
const lodash = require('lodash')

// Local dependencies
const {success, failure} = require('../../paths').demoPayment

module.exports = (req, res) => {
  res.redirect(lodash.get(req, 'payment.govukStatus', '').toLowerCase() === 'success' ? success : failure)
}
