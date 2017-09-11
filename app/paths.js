'use strict'

const path = require('path')

module.exports = {
  default: {
    index: '/'
  },
  healthcheck: {
    path: '/healthcheck'
  },
  staticPaths: {
    naxsiError: '/request-denied'
  },
  generateRoute: require(path.join(__dirname, '/utils/generate_route.js'))
}
