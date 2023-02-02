'use strict'

// NPM dependencies
const { expect } = require('chai')
const cheerio = require('cheerio')
const supertest = require('supertest')

// Local dependencies
const { SELFSERVICE_DEMO_PAYMENT_RETURN_URL } = require('../../config')
const { getApp } = require('../../config/server')
const paths = require('../paths')

describe('payment success controller', () => {
  const productExternalId = 'a-product-external-id'
  let response, $
  before(done => {
    supertest(getApp())
      .get(paths.demoPayment.success.replace(':productExternalId', productExternalId))
      .end((err, res) => {
        response = res
        $ = cheerio.load(response.text)
        done(err)
      })
  })

  it('should respond with status code 302', () => {
    expect(response.statusCode).to.equal(200)
  })

  it('should have a success payment scenario title', () => {
    expect($('h1').text()).to.equal('After a successful payment')
  })

  it('should describe how successful payments are handled in GOV.UK Pay with a link to the documentation', () => {
    expect($('p.scenario-description').text()).to.equal('The user will be directed back to your service where you should show a confirmation page.')
    const docsLink = $('a.scenario-docs-link')
    expect(docsLink.attr('href')).to.equal('https://docs.payments.service.gov.uk#confirmation-page')
    expect(docsLink.text()).to.equal('See how to create a confirmation page in our documentation')
  })

  it('should show a picture of an example error page', () => {
    expect($('h2.error-page-header').text()).to.equal('This is an example confirmation page')
    expect($('img').attr('src')).to.contain('/images/confirmation-page')
  })

  it('should provide a link back to the transactions view in selfservice', () => {
    expect($('p.transactions-prompt').text()).to.equal('You can now view this payment in your transactions list on GOV.UK Pay.')
    const transactionsLink = $('a.transactions-link')
    expect(transactionsLink.text()).to.contain('Go to transactions')
    expect(transactionsLink.attr('href')).to.equal(SELFSERVICE_DEMO_PAYMENT_RETURN_URL.replace(':productExternalId', productExternalId))
  })
})
