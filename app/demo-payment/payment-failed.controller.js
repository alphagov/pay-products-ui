'use strict'

const urlJoin = require('url-join')

const staticify = require('../../config/server').staticify
const { SELFSERVICE_DEMO_PAYMENT_RETURN_URL, DOCS_URL } = require('../../config')

const CONFIRM_FAILURE_VIEW = './demo-payment-failed'

module.exports = (req, res) => {
  const transactionsLink = SELFSERVICE_DEMO_PAYMENT_RETURN_URL.replace(':productExternalId', req.params.productExternalId)
  const data = {
    scenarioDocsLink: urlJoin(DOCS_URL, '/#payment-flow-payment-fails'),
    cardNumbersDocsLink: urlJoin(DOCS_URL, '/#mock-card-numbers-for-testing-purposes'),
    transactionsLink,
    exampleImgSrc: staticify.getVersionedPath('/images/error-page.png')
  }
  res
    .status(200)
    .render(CONFIRM_FAILURE_VIEW, data)
}
