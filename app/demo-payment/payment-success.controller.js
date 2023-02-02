'use strict'

const urlJoin = require('url-join')

const staticify = require('../../config/server').staticify
const { SELFSERVICE_DEMO_PAYMENT_RETURN_URL, DOCS_URL } = require('../../config')

const CONFIRM_SUCCESS_VIEW = './demo-payment-success'

module.exports = (req, res) => {
  const transactionsLink = SELFSERVICE_DEMO_PAYMENT_RETURN_URL.replace(':productExternalId', req.params.productExternalId)
  const data = {
    scenarioDocsLink: urlJoin(DOCS_URL, '/#confirmation-page'),
    transactionsLink,
    exampleImgSrc: staticify.getVersionedPath('/images/confirmation-page.png')
  }
  res.status(200).render(CONFIRM_SUCCESS_VIEW, data)
}
