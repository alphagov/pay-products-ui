'use strict'
const path = require('path')
const envfile = require('envfile')

const TEST_ENV = envfile.parse(path.join(__dirname, '../test.env'))

for (const property in TEST_ENV) {
  process.env[property] = TEST_ENV[property]
}
