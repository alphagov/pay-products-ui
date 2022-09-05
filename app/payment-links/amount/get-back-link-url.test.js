'use strict'

const { expect } = require('chai')

const getBackLinkUrl = require('./get-back-link-url')

describe('getBackLinkUrl', () => {
  it('when there is an `amount`, then it should return the `confirm` page URL', () => {
    const amount = 100

    const product = {
      externalId: 123,
      reference_enabled: false
    }

    const url = getBackLinkUrl(amount, product)

    expect(url).to.equal('/pay/123/confirm')
  })

  it('when there is NO `amount` and `reference_enabled=true`, then it should return the `reference` page URL', () => {
    const amount = 0

    const product = {
      externalId: 123,
      reference_enabled: true
    }

    const url = getBackLinkUrl(amount, product)

    expect(url).to.equal('/pay/123/reference')
  })

  it('when there is NO `amount` and `reference_enabled=true`, but the reference was provided by the query params then it should return the `product` page URL', () => {
    const amount = 0

    const product = {
      externalId: 123,
      reference_enabled: true
    }

    const url = getBackLinkUrl(amount, product, true)

    expect(url).to.equal('/pay/123')
  })

  it('when there is NO `amount` and `reference_enabled=false`, then it should return the `product` page URL', () => {
    const amount = 0

    const product = {
      externalId: 123,
      reference_enabled: false
    }

    const url = getBackLinkUrl(amount, product)

    expect(url).to.equal('/pay/123')
  })
})
