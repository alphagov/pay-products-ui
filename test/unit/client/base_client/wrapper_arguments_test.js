'use strict'

// npm dependencies
const {expect} = require('chai')
const sinon = require('sinon')

// local dependencies
const wrapper = require('../../../../app/services/clients/base_client/wrapper')

describe('wrapper: arguments handling', () => {
  describe('wrapper arguments', () => {
    describe('when the verb argument is set', () => {
      const method = function (options, callback) {
        callback(null, {statusCode: 200, request: options})
      }
      const methodSpy = sinon.spy(method)
      before(done => {
        wrapper(methodSpy, 'get')('http://www.example.com')
          .then(() => done())
          .catch(() => done())
      })
      it(`should set 'opts.method' to be the verb argument (in uppercase)`, () => {
        expect(methodSpy.called).to.equal(true)
        expect(methodSpy.callCount).to.equal(1)
        expect(methodSpy.lastCall.args[0]).to.have.property('method').to.equal('GET')
      })
    })

    describe('when the verb argument is not set', () => {
      const method = function (options, callback) {
        callback(null, {statusCode: 200, request: options})
      }
      const methodSpy = sinon.spy(method)
      before(done => {
        wrapper(methodSpy)('http://www.example.com')
          .then(() => done())
          .catch(() => done())
      })
      it(`should set 'opts.method' to be the verb argument (in uppercase)`, () => {
        expect(methodSpy.called).to.equal(true)
        expect(methodSpy.callCount).to.equal(1)
        expect(methodSpy.lastCall.args[0]).not.to.have.property('method')
      })
    })
  })

  describe('wrapped function arguments', () => {
    describe('arguments', () => {
      describe('when it is passed a uri and an options object', () => {
        const uri = 'http://example.com/'
        const cb = sinon.spy()
        const method = function (options, callback) {
          callback(null, {statusCode: 200, request: options}, 'success')
        }
        const methodSpy = sinon.spy(method)
        before(done => {
          wrapper(methodSpy)(uri, {method: 'GET'}, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should set 'opts.uri' to be the url argument`, () => {
          expect(methodSpy.called).to.equal(true)
          expect(methodSpy.callCount).to.equal(1)
          expect(methodSpy.lastCall.args[0]).to.have.property('uri').to.equal(uri)
        })
        it(`should pass the results of the request to any provided callback`, () => {
          expect(cb.called).to.equal(true)
          expect(cb.lastCall.args[2]).to.equal('success')
        })
      })

      describe('when it is passed a uri and no options object', () => {
        const uri = 'http://example.com/'
        const cb = sinon.spy()
        const method = function (options, callback) {
          callback(null, {statusCode: 200, request: options}, 'success')
        }
        const methodSpy = sinon.spy(method)
        before(done => {
          wrapper(methodSpy, 'get')(uri, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should create an options object, and set it's uri property to be the passed uri`, () => {
          expect(methodSpy.called).to.equal(true)
          expect(methodSpy.lastCall.args[0]).to.have.property('uri').to.equal(uri)
        })
        it(`should pass the results of the request to any provided callback`, () => {
          expect(cb.called).to.equal(true)
          expect(cb.lastCall.args[2]).to.equal('success')
        })
      })

      describe('when it only passed an options object', () => {
        const opts = {uri: 'http://example.com/'}
        const cb = sinon.spy()
        const method = function (options, callback) {
          callback(null, {statusCode: 200, request: options}, 'success')
        }
        const methodSpy = sinon.spy(method)
        before(done => {
          wrapper(methodSpy, 'get')(opts, cb)
            .then(() => done())
            .catch(done)
        })
        it(`should pass the options object to the wrapped request method as it's first argument`, () => {
          expect(methodSpy.called).to.equal(true)
          expect(methodSpy.lastCall.args[0]).to.equal(opts)
        })
        it(`should pass the results of the request to any provided callback`, () => {
          expect(cb.called).to.equal(true)
        })
      })
    })
  })
})
