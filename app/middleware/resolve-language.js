'use strict'

// Local dependencies
const i18n = require('i18n')

module.exports = function (req, res, next) {
  const language = req.product.language
  i18n.setLocale(req, language)
  res.locals.language = language
  next()
}
