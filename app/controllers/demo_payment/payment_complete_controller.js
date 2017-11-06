'use strict'

const {success, failure} = require('../../paths').demoPayment

module.exports = (req, res) => {
  res.redirect(req.payment.status.toLowerCase() === 'success' ? success : failure)
}
