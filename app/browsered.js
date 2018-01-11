'use strict'

// NPM dependencies
require('babel-polyfill')

// Custom dependencies
const fieldValidation = require('./browsered/field-validation')

window.$ = window.jQuery = require('jquery') // This adds jquery globally for non-browserified contexts

fieldValidation.enableFieldValidation()
