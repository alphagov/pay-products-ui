'use strict'
const correlator = require('correlation-id')
const config = require('../../../config')
const nock = require('nock')
const {expect} = require('chai')
const baseClient = require('../../../app/services/clients/base_client/base_client')
let correlationID, outboundRequest

describe('baseClient', () => {
  before(done => {
    correlationID = `${Math.floor(Math.random() * 100000) + 1}`
    nock('http://example.com').get('/').reply(200, 'success')
    correlator.withId(correlationID, () => {
      baseClient.get({url: 'http://example.com/'}, (err, response) => {
        outboundRequest = response.request
        done(err)
      })
    })
  })

  it(`should set outbound request's '${config.CORRELATION_HEADER}' header to be the result of 'correlator.getId()'`, () => {
    expect(outboundRequest.headers).to.have.property(config.CORRELATION_HEADER).to.equal(correlationID)
  })

  it(`should set outbound request's 'Content-Type' header to be 'application/json'`, () => {
    expect(outboundRequest.headers).to.have.property('Content-Type').to.equal('application/json')
  })

  it(`should return a promise`, () => {

  })
})
