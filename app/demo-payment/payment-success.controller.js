'use strict'

const urlJoin = require('url-join')

const staticify = require('../../server').staticify
const { SELFSERVICE_TRANSACTIONS_URL, DOCS_URL } = require('../../config')

const CONFIRM_SUCCESS_VIEW = './success'

const data = {
  scenarioDocsLink: urlJoin(DOCS_URL, '/#confirmation-page'),
  transactionsLink: SELFSERVICE_TRANSACTIONS_URL,
  exampleImgSrc: staticify.getVersionedPath('/images/confirmation-page.png')
}

module.exports = (req, res) => res.status(200).render(CONFIRM_SUCCESS_VIEW, data)
