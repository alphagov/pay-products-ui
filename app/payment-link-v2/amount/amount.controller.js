'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response')
const { getSessionVariable } = require('../../utils/cookie')
const { NotFoundError } = require('../../errors')
const getBackLinkUrl = require('./get-back-link-url')
const paths = require('../../paths')
const { validateAmount } = require('../../utils/validation/form-validations')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const { setSessionVariable } = require('../../utils/cookie')

const PAYMENT_AMOUNT = 'payment-amount'

function validateAmountFormValue (amount, res) {
  const errors = {}
  const amountValidationResult = validateAmount(amount)
  if (!amountValidationResult.valid) {
    errors[PAYMENT_AMOUNT] = res.locals.__p(amountValidationResult.messageKey)
  }

  return errors
}

function getPage (req, res, next) {
  const product = req.product

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  if (product.price) {
    return next(new NotFoundError('Attempted to access amount page with a product that already has a price.'))
  }

  const sessionAmount = getSessionVariable(req, 'amount')

  data.backLinkHref = getBackLinkUrl(sessionAmount, product)

  if (sessionAmount) {
    data.productAmount = (sessionAmount / 100).toFixed(2)
  }

  return response(req, res, 'amount/amount', data)
}

function postPage (req, res, next) {
  const paymentAmount = lodash.get(req.body, PAYMENT_AMOUNT, '')
  const errors = validateAmountFormValue(paymentAmount, res)

  const product = req.product

  const sessionAmount = getSessionVariable(req, 'amount')
  const backLinkHref = getBackLinkUrl(sessionAmount, product)

  const data = {
    productExternalId: product.externalId,
    productName: product.name,
    backLinkHref: backLinkHref
  }

  if (!lodash.isEmpty(errors)) {
    data.errors = errors
    data.amount = paymentAmount

    return response(req, res, 'amount/amount', data)
  }

  setSessionVariable(req, 'paymentAmount', paymentAmount)

  return res.redirect(replaceParamsInPath(paths.paymentLinksV2.confirm, product.externalId))
}

module.exports = {
  getPage,
  postPage
}