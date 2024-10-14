const { defineConfig } = require('cypress')

module.exports = defineConfig({
  fileServerFolder: './test/cypress',
  screenshotsFolder: './test/cypress/screenshots',
  videosFolder: './test/cypress/videos',
  video: false,
  env: {
    TEST_SESSION_ENCRYPTION_KEY: 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk',
    MOCK_HTTP_SERVER_URL: 'http://127.0.0.1:8000',
    MOCK_HTTP_SERVER_PORT: 8000
  },
  e2e: {
    setupNodeEvents (on, config) {
      return require('./test/cypress/plugins')(on, config)
    },
    baseUrl: 'http://127.0.0.1:3000',
    specPattern: './test/cypress/integration/**/*.cy.js',
    supportFile: './test/cypress/support',
    viewportHeight: 800,
    viewportWidth: 1280
  },
})