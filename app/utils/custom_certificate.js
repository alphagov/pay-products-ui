'use strict'

// Core Dependencies
const path = require('path')
const fs = require('fs')

// NPM Dependencies
const logger = require('winston')

const certsPath = process.env.CERTS_PATH || path.join(__dirname, '/../../certs')
exports.addCertsToAgent = agentOptions => {
  try {
    if (!fs.lstatSync(certsPath).isDirectory()) {
      logger.error('Provided CERTS_PATH is not a directory', {
        certsPath: certsPath
      })
      return
    }
  } catch (e) {
    logger.error('Provided CERTS_PATH could not be read', {
      certsPath: certsPath
    })
    return
  }

  agentOptions.ca = agentOptions.ca || []
  fs.readdirSync(certsPath).forEach(
    (certPath) => agentOptions.ca.push(
      fs.readFileSync(path.join(certsPath, certPath))
    )
  )
}
