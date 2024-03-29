var sinon = require('sinon')
var assert = require('assert')
var proxyquire = require('proxyquire')

describe('CSRF', function () {
  it('should create a CSRF token', function () {
    var verify = sinon.stub()
      .withArgs("it's a secret", 'submitted token')
      .returns(true)

    var create = sinon.stub()
      .withArgs("it's a secret")
      .returns('newly-created token')

    var csrf = proxyquire('./csrf.js',
      {
        csrf: () => {
          return {
            verify: verify,
            create: create
          }
        }
      }).validateAndRefreshCsrf

    var req = {
      route: { methods: { post: {} } },
      session: { csrfSecret: "it's a secret" },
      body: { csrfToken: 'submitted token' }
    }

    var res = { locals: {} }

    var next = sinon.spy()

    csrf(req, res, next)

    assert.strictEqual(res.locals.csrf, 'newly-created token')
    assert(next.calledOnce)
  })

  it('should error if session not present', function () {
    var renderErrorView = sinon.spy()
    var csrf = proxyquire('./csrf.js', {
      '../utils/response.js': {
        renderErrorView: renderErrorView
      }
    }).validateAndRefreshCsrf

    var req = {
      route: { methods: { post: {} } },
      body: { csrfToken: 'submitted token' }
    }

    var res = { locals: {} }

    var next = sinon.spy()

    csrf(req, res, next)

    sinon.assert.calledWith(renderErrorView, req, res)
  })

  it('should error if session has no CSRF secret', function () {
    var renderErrorView = sinon.spy()
    var csrf = proxyquire('./csrf.js', {
      '../utils/response.js': {
        renderErrorView: renderErrorView
      }
    }).validateAndRefreshCsrf

    var req = {
      route: { methods: { post: {} } },
      session: {},
      body: { csrfToken: 'submitted token' }
    }

    var res = { locals: {} }

    var next = sinon.spy()

    csrf(req, res, next)

    sinon.assert.calledWith(renderErrorView, req, res)
  })

  it('should error if CSFR token is not valid', function () {
    var renderErrorView = sinon.spy()
    var verify = sinon.stub()
      .withArgs("it's a secret", 'forged token - call the police')
      .returns(false)
    var csrf = proxyquire('./csrf.js', {
      '../utils/response.js': {
        renderErrorView: renderErrorView
      },
      csrf: () => {
        return {
          verify: verify
        }
      }
    }).validateAndRefreshCsrf

    var req = {
      route: { methods: { post: {} } },
      session: { csrfSecret: "it's a secret" },
      body: { csrfToken: 'forged token - call the police' }
    }

    var res = { locals: {} }

    var next = sinon.spy()

    csrf(req, res, next)

    sinon.assert.calledWith(renderErrorView, req, res)
  })

  it('should not error if CSRF token is not valid but method is GET', function () {
    var verify = sinon.stub()
      .withArgs("it's a secret", "submitted forged token - but we don't really care")
      .returns(false)

    var create = sinon.stub()
      .withArgs("it's a secret")
      .returns('newly-created token')

    var csrf = proxyquire('./csrf.js',
      {
        csrf: () => {
          return {
            verify: verify,
            create: create
          }
        }
      }).validateAndRefreshCsrf

    var req = {
      method: 'GET',
      session: { csrfSecret: "it's a secret" },
      body: { csrfToken: "submitted forged token - but we don't really care" }
    }

    var res = { locals: {} }

    var next = sinon.spy()

    csrf(req, res, next)

    assert.strictEqual(res.locals.csrf, 'newly-created token')
    assert(next.calledOnce)
  })
})
