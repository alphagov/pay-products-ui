const { expect } = require('chai')

const paymentLinkSession = require('./payment-link-session')

const productExternalId = 'a-product-external-id'
const reference = 'REF123'
const amount = 1234
const error = 'some-error'

describe('Payment link session utilities', () => {
  describe('Get reference', () => {
    it('should return undefined when there is no session', () => {
      const req = {}
      const sessionRef = paymentLinkSession.getReference(req, productExternalId)
      expect(sessionRef).to.equal(undefined)
    })

    it('should return reference from session', () => {
      const req = {
        session: {
          'a-product-external-id': {
            reference
          }
        }
      }
      const sessionRef = paymentLinkSession.getReference(req, productExternalId)
      expect(sessionRef).to.equal(reference)
    })
  })

  describe('Set reference', () => {
    it('should set the reference when there is no payment link session', () => {
      const req = {}
      paymentLinkSession.setReference(req, productExternalId, reference)

      expect(paymentLinkSession.getReference(req, productExternalId)).to.equal(reference)
      expect(paymentLinkSession.getReferenceProvidedByQueryParams(req, productExternalId)).to.equal(false)
    })

    it('should set the reference and referenceProvidedByQueryParams', () => {
      const req = {}
      paymentLinkSession.setReference(req, productExternalId, reference, true)

      expect(paymentLinkSession.getReference(req, productExternalId)).to.equal(reference)
      expect(paymentLinkSession.getReferenceProvidedByQueryParams(req, productExternalId)).to.equal(true)
    })

    it('should override existing reference', () => {
      const req = {
        session: {
          'a-product-external-id': {
            reference: 'OLDREF'
          }
        }
      }
      paymentLinkSession.setReference(req, productExternalId, reference)

      const sessionRef = paymentLinkSession.getReference(req, productExternalId)
      expect(sessionRef).to.equal(reference)
    })
  })

  describe('Get amount', () => {
    it('should return undefined when there is no session', () => {
      const req = {}
      const sessionAmount = paymentLinkSession.getAmount(req, productExternalId)
      expect(sessionAmount).to.equal(undefined)
    })

    it('should return amount from session', () => {
      const req = {
        session: {
          'a-product-external-id': {
            amount
          }
        }
      }
      const sessionRef = paymentLinkSession.getAmount(req, productExternalId)
      expect(sessionRef).to.equal(amount)
    })
  })

  describe('Set amount', () => {
    it('should set the amount when there is no payment link session', () => {
      const req = {}
      paymentLinkSession.setAmount(req, productExternalId, amount)

      expect(paymentLinkSession.getAmount(req, productExternalId)).to.equal(amount)
      expect(paymentLinkSession.getAmountProvidedByQueryParams(req, productExternalId)).to.equal(false)
    })

    it('should set the amount and amountProvidedByQueryParams', () => {
      const req = {}
      paymentLinkSession.setAmount(req, productExternalId, amount, true)

      expect(paymentLinkSession.getAmount(req, productExternalId)).to.equal(amount)
      expect(paymentLinkSession.getAmountProvidedByQueryParams(req, productExternalId)).to.equal(true)
    })

    it('should override existing amount', () => {
      const req = {
        session: {
          'a-product-external-id': {
            amount: 2
          }
        }
      }
      paymentLinkSession.setAmount(req, productExternalId, amount)

      const sessionAmount = paymentLinkSession.getAmount(req, productExternalId)
      expect(sessionAmount).to.equal(amount)
    })
  })

  describe('Get error', () => {
    it('should return undefined when there is no session', () => {
      const req = {}
      const sessionAmount = paymentLinkSession.getError(req, productExternalId)
      expect(sessionAmount).to.equal(undefined)
    })

    it('should return error from session', () => {
      const req = {
        session: {
          'a-product-external-id': {
            error
          }
        }
      }
      const sessionRef = paymentLinkSession.getError(req, productExternalId)
      expect(sessionRef).to.equal('some-error')
    })
  })

  describe('Set error', () => {
    it('should set the error when there is no payment link session', () => {
      const req = {}
      paymentLinkSession.setError(req, productExternalId, error)

      expect(paymentLinkSession.getError(req, productExternalId)).to.equal(error)
    })
  })

  describe('Delete session', () => {
    it('should delete session for product external id', () => {
      const req = {
        session: {
          'a-product-external-id-1': {
            reference: 'REF1',
            amount: 1
          },
          'a-product-external-id-2': {
            reference: 'REF2',
            amount: 2
          }
        }
      }
      paymentLinkSession.deletePaymentLinkSession(req, 'a-product-external-id-1')
      expect(req).to.deep.equal({
        session: {
          'a-product-external-id-2': {
            reference: 'REF2',
            amount: 2
          }
        }
      })
    })
  })
})
