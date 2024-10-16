// ***********************************************************
// This file is used to load plugins.
//
// You can read more about Cypress plugins here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

'use strict'

const axios = require('axios')

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  const stubSetupUrl = config.env.MOCK_HTTP_SERVER_URL + '/__add-mock-endpoints__'
  const stubResetUrl = config.env.MOCK_HTTP_SERVER_URL + '/__clear-mock-endpoints__'

  on('task', {
    /**
     * Makes a post request to Mountebank to setup an Imposter with stubs built using the array of
     * stubs
     *
     * Note: this task can only be called once per test, so all stubs for a test must be set up in
     * the same call.
     */
    setupStubs (stubs) {
      return axios.post(stubSetupUrl,
        {
          port: config.env.MOUNTEBANK_IMPOSTERS_PORT,
          protocol: 'http',
          stubs
        })
        .then(function () { return ''})
        .catch(function (error) { throw error})
    },
    /**
     * Makes a request to Mountebank to delete the existing Imposter along with all stubs that have been set up.
     */
    clearStubs () {
      return axios.post(stubResetUrl)
        .then(function () { return ''})
        .catch(function (error) { throw error})
    }
  })

  // send back the modified config object
  return config
}
