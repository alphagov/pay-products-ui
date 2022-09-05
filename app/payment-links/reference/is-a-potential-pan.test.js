'use strict'

const isAPotentialPAN = require('./is-a-potential-pan')
const { expect } = require('chai')

describe('Is A Potential card number', () => {
  it('should return true if reference passes luhn check', () => {
    expect(isAPotentialPAN('4242424242424242')).to.equal(true)
  })
  it('should return true if reference has characters [- or space] and passes luhn check', () => {
    expect(isAPotentialPAN('4242 4242 4242-42-42')).to.equal(true)
  })
  it('should return false if reference is less than 12 digits', () => {
    expect(isAPotentialPAN('42424242424')).to.equal(false)
  })
  it('should return false if reference has more than 19 digits', () => {
    expect(isAPotentialPAN('4242 4242 4242 4242 4242 4242')).to.equal(false)
  })
  it('should return false if reference fails luhn check', () => {
    expect(isAPotentialPAN('42424242424211')).to.equal(false)
  })
  it('should return false if reference has characters [- or space] and but fails luhn check', () => {
    expect(isAPotentialPAN('4242-4242-4242-11')).to.equal(false)
  })
  it('should return false for reference with characters', () => {
    expect(isAPotentialPAN('REF123456')).to.equal(false)
  })
})
