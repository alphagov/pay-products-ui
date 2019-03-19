'use strict'

// Local dependencies
const i18n = require('i18n')

module.exports = function (req, res, next) {
  // req.product.languages doesn’t exsist yet but YOLO
  const language = req.product.language || 'en'
  i18n.setLocale(req, language)
  res.locals.translationStrings = JSON.stringify(i18n.getCatalog(language))
  res.locals.language = language
  next()
}
