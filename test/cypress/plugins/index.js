// ***********************************************************
// This file is used to load plugins.
//
// You can read more about Cypress plugins here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

'use strict'

const request = require('request-promise-native')

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  const mountebankImpostersUrl = config.env.MOUNTEBANK_URL + '/imposters'

  on('task', {
    /**
     * Makes a post request to Mountebank to setup an Imposter with stubs built using the array of
     * stubs
     *
     * Note: this task can only be called once per test, so all stubs for a test must be set up in
     * the same call.
     */
    setupStubs (stubs) {
      return request({
        method: 'POST',
        url: mountebankImpostersUrl,
        json: true,
        body: {
          port: config.env.MOUNTEBANK_IMPOSTERS_PORT,
          protocol: 'http',
          stubs
        }
      })
    },
    /**
     * Makes a request to Mountebank to delete the existing Imposter along with all stubs that have been set up.
     */
    clearStubs () {
      return request.delete(mountebankImpostersUrl)
    },
    /**
     * Makes a request to Mountebank to verify that stubs have been called the expected number of times
     */
    verifyStubs () {
      return request({
        method: 'GET',
        url: `${mountebankImpostersUrl}/${config.env.MOUNTEBANK_IMPOSTERS_PORT}`,
        json: true
      }).then(response => {
        response.stubs.forEach((stub) => {
          // NOTE: if the "verifyCalledTimes" is specified for a stub, we will attempt to verify
          // for all `it` blocks the stub is setup for, and the counter is reset for every `it`.
          if (stub.verifyCalledTimes) {
            // the matches array is added to stubs only when Mountebank is run with the --debug flag
            const timesCalled = (stub.matches && stub.matches.length) || 0
            if (timesCalled !== stub.verifyCalledTimes) {
              throw new Error(`Expected stub '${stub.name}' to be called ${stub.verifyCalledTimes} times, but was called ${timesCalled} times`)
            }
          }
        })

        return null
      })
        .catch(err => {
          if (err.statusCode === 404) {
            // imposter probably hasn't been added in Mountebank as no stubs were setup for the current
            // test
            return null
          }
          throw err
        })
    }
  })

  // send back the modified config object
  return config
}
