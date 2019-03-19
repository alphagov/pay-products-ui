'use strict'

const path = require('path')
const { NODE_ENV } = process.env

module.exports = {
  locales: ['en'],
  directory: path.join(__dirname, '../locales'),
  objectNotation: true,
  defaultLocale: 'en',
  register: global,
  autoReload: NODE_ENV !== 'production'
}
