'use strict'

// npm dependencies
const {expect} = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noPreserveCache()

const getCookiesUtil = sessionsStub => {
  if (sessionsStub) return proxyquire('../../../app/utils/cookie', {'client-sessions': sessionsStub})
  return proxyquire('../../../app/utils/cookie', {})
}

describe('cookie configuration', function () {
  describe('when setting the config', function () {
    it('should configure cookie correctly', function () {
      const clientSessionsStub = sinon.stub()
      const cookies = getCookiesUtil(clientSessionsStub)

      const expectedConfig = {
        cookieName: 'session',
        secret: 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk',
        duration: 10800000,
        proxy: true,
        cookie: {
          ephemeral: false,
          httpOnly: true,
          secureProxy: true
        }
      }

      cookies.sessionCookie()

      expect(clientSessionsStub.calledWith(expectedConfig)).to.equal(true)
    })
    it('should throw an error if no session key is set', function () {
      process.env.SESSION_ENCRYPTION_KEY = ''

      const clientSessionsStub = sinon.stub()
      const cookies = getCookiesUtil(clientSessionsStub)

      expect(() => cookies.sessionCookie()).to.throw(/cookie encryption key is not set/)
    })
    it('should throw an error if no max age is set', function () {
      process.env.SESSION_ENCRYPTION_KEY = 'test encryption'
      process.env.COOKIE_MAX_AGE = ''

      const clientSessionsStub = sinon.stub()
      const cookies = getCookiesUtil(clientSessionsStub)

      expect(() => cookies.sessionCookie()).to.throw(/cookie max age is not set/)
    })
  })

  describe(`when setting value on cookie 'session'`, function () {
    it(`should set value on cookie 'session' if SESSION_ENCRYPTION_KEY set`, function () {
      process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
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

  describe(`should get value from cookie 'session'`, function () {
    it('only if SESSION_ENCRYPTION_KEY is set and cookie exists', function () {
      process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
      const cookies = getCookiesUtil()
      const req = {
        session: {
          testKey: 'testValue'
        }
      }

      expect(cookies.getSessionVariable(req, 'testKey')).to.equal('testValue')
    })
  })

  describe(`should NOT get value from cookie 'session'`, function () {
    it('when session key is NOT set', function () {
      process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
      const cookies = getCookiesUtil()
      const req = {
        session: {}
      }

      expect(cookies.getSessionVariable(req, 'testKey')).to.equal(undefined)
    })
  })

  describe(`should NOT get value`, function () {
    it('when cookie does NOT exist', function () {
      process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk'
      const cookies = getCookiesUtil()
      const req = {}

      expect(cookies.getSessionVariable(req, 'testKey')).to.equal(undefined)
    })
  })
})
