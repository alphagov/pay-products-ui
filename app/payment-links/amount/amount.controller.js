'use strict'

const lodash = require('lodash')

const { response } = require('../../utils/response')
const { NotFoundError } = require('../../errors')
const getBackLinkUrl = require('./get-back-link-url')
const paths = require('../../paths')
const { validateAmount } = require('../../utils/validation/form-validations')
const replaceParamsInPath = require('../../utils/replace-params-in-path')
const paymentLinkSession = require('../utils/payment-link-session')
const { convertPoundsAndPenceToPence, convertPenceToPoundsAndPence } = require('../../utils/currency')

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
  const { change } = req.query || {}

  const data = {
    productExternalId: product.externalId,
    productName: product.name
  }

  if (product.price) {
    return next(new NotFoundError('Attempted to access amount page with a product that already has a price.'))
  }

  const sessionAmount = paymentLinkSession.getAmount(req, product.externalId)
  const referenceProvidedByQueryParams = paymentLinkSession.getReferenceProvidedByQueryParams(req, product.externalId)
  data.backLinkHref = getBackLinkUrl(change, product, referenceProvidedByQueryParams)

  if (sessionAmount) {
    data.amount = convertPenceToPoundsAndPence(sessionAmount)
  }

  if (paymentLinkSession.getError(req, product.externalId)) {
    const errors = {}
    const errorMessage = paymentLinkSession.getError(req, product.externalId)
    errors[PAYMENT_AMOUNT] = errorMessage
    paymentLinkSession.setError(req, product.externalId, '')
    data.errors = errors
    paymentLinkSession.removeAmount(req, product.externalId)
  }

  return response(req, res, 'amount/amount', data)
}

function postPage (req, res, next) {
  const paymentAmount = lodash.get(req.body, PAYMENT_AMOUNT, '')
  const { change } = req.query || {}
  const errors = validateAmountFormValue(paymentAmount, res)

  const product = req.product

  const referenceProvidedByQueryParams = paymentLinkSession.getReferenceProvidedByQueryParams(req, product.externalId)
  const backLinkHref = getBackLinkUrl(change, product, referenceProvidedByQueryParams)

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

  const paymentAmountInPence = convertPoundsAndPenceToPence(paymentAmount)

  paymentLinkSession.setAmount(req, product.externalId, paymentAmountInPence)

  return res.redirect(replaceParamsInPath(paths.paymentLinks.confirm, product.externalId))
}

module.exports = {
  getPage,
  postPage
}
