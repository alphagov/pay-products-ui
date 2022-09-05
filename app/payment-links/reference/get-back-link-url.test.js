'use strict'

const { expect } = require('chai')

const getBackLinkUrl = require('./get-back-link-url')

describe('getBackLinkUrl', () => {
  it('when there is an `reference`, then it should return the `confirm` page URL', () => {
    const reference = 'a-valid-reference'

    const product = {
      externalId: 123,
      reference_enabled: true
    }

    const url = getBackLinkUrl(reference, product)

    expect(url).to.equal('/pay/123/confirm')
  })

  it('when there is NO `reference`, then it should return the `product` page URL', () => {
    const reference = 0

    const product = {
      externalId: 123,
      reference_enabled: true
    }

    const url = getBackLinkUrl(reference, product)

    expect(url).to.equal('/pay/123')
  })
})
