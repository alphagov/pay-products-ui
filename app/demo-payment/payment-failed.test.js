'use strict'

// NPM dependencies
const { expect } = require('chai')
const cheerio = require('cheerio')
const supertest = require('supertest')

// Local dependencies
const { SELFSERVICE_DEMO_PAYMENT_RETURN_URL } = require('../../config')
const { getApp } = require('../../config/server')
const paths = require('../paths')

describe('payment failed controller', () => {
  const productExternalId = 'a-product-external-id'
  let response, $
  before(done => {
    supertest(getApp())
      .get(paths.demoPayment.failure.replace(':productExternalId', productExternalId))
      .end((err, res) => {
        response = res
        $ = cheerio.load(response.text)
        done(err)
      })
  })

  it('should respond with status code 302', () => {
    expect(response.statusCode).to.equal(200)
  })

  it('should have a failed payment scenario title', () => {
    expect($('h1').text()).to.equal('After a failed payment')
  })

  it('should describe how failed payments are handled in GOV.UK Pay with a link to the documentation', () => {
    expect($('p.scenario-description').text()).to.equal('If the payment fails, the user will see a GOV.UK Pay error page. This includes a link to return to your service where you should give them useful next steps.')
    const docsLink = $('a.scenario-docs-link')
    expect(docsLink.attr('href')).to.equal('https://docs.payments.service.gov.uk#payment-flow-payment-fails')
    expect(docsLink.text()).to.equal('See what you should do after a failed payment in our documentation')
  })

  it('should show a picture of an example error page', () => {
    expect($('h2.error-page-header').text()).to.equal('This is an example error page')
    expect($('img').attr('src')).to.contain('/images/error-page')
  })

  it('should encourage the user to try a different card number', () => {
    expect($('p.try-a-different-card-number').text()).to.equal('Try a different card number to see a successful confirmation.')
    const differentCardNumbersLink = $('p.try-a-different-card-number a')
    expect(differentCardNumbersLink.text()).to.equal('Try a different card number')
    expect(differentCardNumbersLink.attr('href')).to.equal('https://docs.payments.service.gov.uk#mock-card-numbers-for-testing-purposes')
  })

  it('should provide a link back to the transactions view in selfservice', () => {
    expect($('p.transactions-prompt').text()).to.equal('You can now view this payment in your transactions list on GOV.UK Pay.')
    const transactionsLink = $('a.transactions-link')
    expect(transactionsLink.text()).to.contain('Go to transactions')
    expect(transactionsLink.attr('href')).to.equal(SELFSERVICE_DEMO_PAYMENT_RETURN_URL.replace(':productExternalId', productExternalId))
  })
})
