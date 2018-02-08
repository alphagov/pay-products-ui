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
    // Read everything from the certificates directories
    // Get everything that isn't a directory (e.g. files, symlinks)
    // Read it (assume it is a certificate)
    // Add it to the agentOptions list of CAs
  fs.readdirSync(certsPath)
      .map(certPath => path.join(certsPath, certPath))
      .filter(fullCertPath => !fs.lstatSync(fullCertPath).isDirectory())
      .map(fullCertPath => fs.readFileSync(fullCertPath))
      .forEach(ca => agentOptions.ca.push(ca))
}
