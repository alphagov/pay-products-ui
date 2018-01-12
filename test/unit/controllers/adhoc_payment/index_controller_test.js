'use strict'
const chai = require('chai')
const config = require('../../../../config')
const cheerio = require('cheerio')
const nock = require('nock')
const supertest = require('supertest')
const {getApp} = require('../../../../server')
const {createAppWithSession} = require('../../../test_helpers/mock_session')
const productFixtures = require('../../../fixtures/product_fixtures')
const paths = require('../../../../app/paths')
const expect = chai.expect
let product, response, $

describe('adhoc payment index controller', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  before(done => {
    product = productFixtures.validCreateProductResponse({
      type: 'ADHOC',
      product_name: 'Super duper product',
      service_name: 'Super GOV service',
      description: 'Super duper product description'
    }).getPlain()
    nock(config.PRODUCTS_URL).get(`/v1/api/products/${product.external_id}`).reply(200, product)

    supertest(createAppWithSession(getApp()))
      .get(paths.pay.product.replace(':productExternalId', product.external_id))
      .end((err, res) => {
        response = res
        $ = cheerio.load(res.text || '')
        done(err)
      })
  })

  it('should respond with code:200 OK', () => {
    expect(response.statusCode).to.equal(200)
  })

  it('should render adhoc payment start page', () => {
    expect($('title').text()).to.include(product.service_name)
    expect($('h1.heading-large').text()).to.include(product.name)
    expect($('p#description').text()).to.include(product.description)
    expect($('form').attr('action')).to.equal(`/pay/${product.external_id}`)
  })
})
