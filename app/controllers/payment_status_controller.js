'use strict'

// Custom dependencies
const response = require('../utils/response').response

function beautify (reference, spacingPosition) {
  let chunks = []
  let i
  for (i = -1; i < reference.length; i += spacingPosition) {
    chunks.push(reference.substr(i, spacingPosition))
  }
  return chunks
}

module.exports = (req, res) => {
  const payment = req.payment
  const data = {
    referenceNumber: beautify(payment.referenceNumber, 4).join('-'),
    status: payment.govukStatus
  }
  response(req, res, 'adhoc-payment/confirmation', data)
}
