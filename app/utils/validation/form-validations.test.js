'use strict'

const { expect } = require('chai')

const validations = require('./form-validations')

const textThatIs255CharactersLong = 'This text contains exactly 255 characters and this is the precise maximum number ' +
    'allowed for a payment reference and therefore it should pass the validation that checks the text is at most 255 ' +
    'characters in length and not a single character more than that'

const textThatIs256CharactersLong = 'This is a piece of text that contains exactly 256 characters and this is 1 higher ' +
    'than 255 characters and as such it will fail any validation that checks if the text has a length of 255 ' +
    'characters or fewer because it is exactly 1 character longer than that'

describe('Server side form validations', () => {
  describe('amount validation', () => {
    it('when valid amount entered, should return valid=true', () => {
      expect(validations.validateAmount('100').valid).to.be.true // eslint-disable-line
    })

    it('when no amount entered, should return valid=false and the correct error message key', () => {
      expect(validations.validateAmount('')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinks.fieldValidation.enterAnAmountInPounds'
      })
    })

    it('when an invalid string entered, should return valid=false and correct error message key', () => {
      expect(validations.validateAmount('Invalid amount')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinks.fieldValidation.enterAnAmountInTheCorrectFormat'
      })
    })

    it('when a number entered that is greater then the MAX amount, should return valid=false and correct error message key', () => {
      expect(validations.validateAmount('100000.01')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinks.fieldValidation.enterAnAmountUnderMaxAmount'
      })
    })
  })

  describe('reference validation', () => {
    it('when valid reference is entered, should return valid=true', () => {
      expect(validations.validateReference(textThatIs255CharactersLong).valid).to.be.true // eslint-disable-line
    })

    it('when no amount entered, should return valid=false and the correct error message key', () => {
      expect(validations.validateReference('')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinks.fieldValidation.enterAReference'
      })
    })

    it('when a reference is too long, should return valid=false and correct error message key', () => {
      expect(validations.validateReference(textThatIs256CharactersLong)).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinks.fieldValidation.referenceTooLong'
      })
    })

    it('when a reference is entered that is not Naxsi safe, should return valid=false and correct error message key', () => {
      expect(validations.validateAmount('>')).to.deep.equal({
        valid: false,
        messageKey: 'paymentLinks.fieldValidation.enterAnAmountInTheCorrectFormat'
      })
    })
  })
})
