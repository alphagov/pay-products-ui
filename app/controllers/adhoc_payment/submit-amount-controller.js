'use strict'

// Custom dependencies
const response = require('../../utils/response').response

module.exports = (req, res) => {
  response(req, res, 'adhoc-payment/amount', {})
}
