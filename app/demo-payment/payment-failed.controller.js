'use strict'

const urlJoin = require('url-join')

const staticify = require('../../server').staticify
const { SELFSERVICE_TRANSACTIONS_URL, DOCS_URL } = require('../../config')

const CONFIRM_FAILURE_VIEW = './demo-payment-failed'

const data = {
  scenarioDocsLink: urlJoin(DOCS_URL, '/#payment-flow-payment-fails'),
  cardNumbersDocsLink: urlJoin(DOCS_URL, '/#mock-card-numbers-for-testing-purposes'),
  transactionsLink: SELFSERVICE_TRANSACTIONS_URL,
  exampleImgSrc: staticify.getVersionedPath('/images/error-page.png')
}

module.exports = (req, res) => {
  res
    .status(200)
    .render(CONFIRM_FAILURE_VIEW, data)
}
