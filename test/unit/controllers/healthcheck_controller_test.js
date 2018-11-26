'use strict'

// NPM dependencies
const { expect } = require('chai')
const supertest = require('supertest')

// Local dependencies
const { getApp } = require('../../../server')
const paths = require('../../../app/paths')

describe('healthcheck controller', () => {
  let response

  before(done => {
    supertest(getApp())
      .get(paths.healthcheck.path)
      .end((err, res) => {
        response = res
        done(err)
      })
  })

  it(`should return with a 'content-type' header of 'application/json'`, () => {
    expect(response.headers).to.have.property('content-type').to.contain('application/json')
  })

  it(`should return an object with a property 'ping', which is itself an object with a property of 'healthy' whose value is 'true'`, () => {
    expect(response.body).to.have.property('ping')
    expect(response.body.ping).to.have.property('healthy').to.equal(true)
  })
})
