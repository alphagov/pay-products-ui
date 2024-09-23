'use strict'

// npm dependencies
const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noPreserveCache()

const getCookiesUtil = sessionsStub => {
  if (sessionsStub) return proxyquire('./cookie', { 'client-sessions': sessionsStub })
  return proxyquire('./cookie', {})
}

describe('cookie configuration', function () {
  describe('when setting the config correctly', function () {
    it('should set session with expected values', function () {
      const clientSessionsStub = sinon.stub()
      const cookies = getCookiesUtil(clientSessionsStub)

      const expectedConfig = {
        cookieName: 'session',
        secret: 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk', // pragma: allowlist secret
        duration: 10800000,
        proxy: true,
        cookie: {
          ephemeral: false,
          httpOnly: true,
          secureProxy: true,
          SameSite: 'Lax'
        }
      }

      cookies.sessionCookie()

      expect(clientSessionsStub.calledWith(expectedConfig)).to.equal(true)
    })
  })
  describe('when missing SESSION_ENCRYPTION_KEY', () => {
    it('should throw an error if no session key is set', function () {
      process.env.SESSION_ENCRYPTION_KEY = ''

      const clientSessionsStub = sinon.stub()
      const cookies = getCookiesUtil(clientSessionsStub)

      expect(() => cookies.sessionCookie()).to.throw(/cookie encryption key is not set/)
    })
  })
  describe('when missing COOKIE_MAX_AGE', () => {
    it('should throw an error if no max age is set', function () {
      process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
      process.env.COOKIE_MAX_AGE = ''

      const clientSessionsStub = sinon.stub()
      const cookies = getCookiesUtil(clientSessionsStub)

      expect(() => cookies.sessionCookie()).to.throw(/cookie max age is not set/)
    })
  })

  describe('when setting value on cookie \'session\'', function () {
    it('should set value on cookie \'session\' if SESSION_ENCRYPTION_KEY set', function () {
      const cookies = getCookiesUtil()
      const req = {
        session: {}
      }

      cookies.setSessionVariable(req, 'testKey', 'testValue')

      expect(req.session.testKey).to.equal('testValue')
    })
    it('does not set value on non-existent cookie', function () {
      const cookies = getCookiesUtil()
      const req = {}

      cookies.setSessionVariable(req, 'testKey', 'testValue')

      expect(req).to.deep.equal({})
    })
  })

  describe('when SESSION_ENCRYPTION_KEY is set and cookie exists', function () {
    it('should get value from cookie \'session\'', function () {
      const cookies = getCookiesUtil()
      const req = {
        session: {
          testKey: 'testValue'
        }
      }

      expect(cookies.getSessionVariable(req, 'testKey')).to.equal('testValue')
    })
  })

  describe('when session key is NOT set', function () {
    it('should NOT get value from cookie', function () {
      const cookies = getCookiesUtil()
      const req = {
        session: {}
      }

      expect(cookies.getSessionVariable(req, 'testKey')).to.equal(undefined)
    })
  })

  describe('when cookie does NOT exist', function () {
    it('should NOT get value', function () {
      const cookies = getCookiesUtil()
      const req = {}

      expect(cookies.getSessionVariable(req, 'testKey')).to.equal(undefined)
    })
  })
})
