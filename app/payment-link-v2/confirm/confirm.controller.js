'use strict'

const { response } = require('../../utils/response')
const { paymentLinksV2 } = require('../../paths')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { getSessionVariable } = require('../../utils/cookie')
const { NotFoundError } = require('../../errors')

const HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE = 'reference-value'
const HIDDEN_FORM_FIELD_ID_AMOUNT = 'amount'

function generateSummaryElement (summaryLabel, summaryValue, changeUrl, hiddenFormFieldId) {
  return {
    summaryLabel,
    summaryValue,
    changeUrl,
    hiddenFormFieldId
  }
}

function getRightAmountToDisplayAsGbp (sessionAmount, productAmount) {
  const amountToDisplay = sessionAmount || (productAmount / 100).toFixed(2)

  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amountToDisplay)
}

function getPage (req, res, next) {
  const product = req.product

  const sessionReferenceNumber = getSessionVariable(req, 'referenceNumber')
  const sessionAmount = getSessionVariable(req, 'amount')

  if (!sessionAmount && !product.price) {
    return next(new NotFoundError('Attempted to access confirm page without a price in the session or product.'))
  }

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  const summaryElements = []

  if (sessionReferenceNumber) {
    summaryElements.push(generateSummaryElement(
      product.reference_label,
      sessionReferenceNumber,
      replaceParamsInPath(paymentLinksV2.reference, product.externalId),
      HIDDEN_FORM_FIELD_ID_REFERENCE_VALUE
    ))
  }

  const changeAmountUrl = replaceParamsInPath(paymentLinksV2.amount, product.externalId)
  const totalToPayText = res.locals.__p('paymentLinksV2.confirm.totalToPay')

  const getAmountToDisplay = getRightAmountToDisplayAsGbp(sessionAmount, product.price)

  summaryElements.push(generateSummaryElement(
    totalToPayText,
    getAmountToDisplay,
    changeAmountUrl,
    HIDDEN_FORM_FIELD_ID_AMOUNT
  ))

  data.summaryElements = summaryElements
  data.confirmPageUrl = replaceParamsInPath(paymentLinksV2.confirm, product.externalId)

  return response(req, res, 'confirm/confirm', data)
}

module.exports = {
  getPage
}
