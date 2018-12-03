'use strict'

// NPM dependencies
const GOVUKFrontend = require('govuk-frontend')

// Custom dependencies
const fieldValidation = require('./browsered/field-validation')
const inputConfim = require('./browsered/input-confirm')

GOVUKFrontend.initAll()

fieldValidation.enableFieldValidation()
inputConfim()
