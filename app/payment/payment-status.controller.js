'use strict'

// Node.js core dependencies
const currencyFormatter = require('currency-formatter')

// Custom dependencies
const response = require('../utils/response').response
const { pay } = require('../paths')
const { SELFSERVICE_DASHBOARD_URL } = require('../../config')

function asGBP (amountInPence) {
  return currencyFormatter.format((amountInPence / 100).toFixed(2), { code: 'GBP' })
}

module.exports = (req, res) => {
  const product = req.product
  const payment = req.payment
  const data = {}

  if (payment.govukStatus.toLowerCase() === 'success') {
    data.payment = {
      reference: payment.referenceNumber,
      amount: asGBP(payment.amount)
    }
    if (product.type === 'AGENT_INITIATED_MOTO') {
      data.payment.agentInitiatedMoto = true
      data.payment.dashboardLink = SELFSERVICE_DASHBOARD_URL
    }
    return response(req, res, './payment-confirmation', data)
  } else {
    data.backToStartPage = pay.product.replace(':productExternalId', product.externalId)
    return response(req, res, './payment-failed', data)
  }
}
