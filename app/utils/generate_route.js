'use strict'

const _ = require('lodash')
const querystring = require('querystring')

module.exports = function (route, params) {
  let copiedParams = _.cloneDeep(params)

  let init = function () {
    _.forEach(copiedParams, checkNamedParams)
    let query = constructQueryString()
    return route + query
  }

  let checkNamedParams = function (value, key) {
    let hasNamedParam = route.indexOf(':' + key) !== -1
    if (!hasNamedParam) return
    replaceAndDeleteNamedParam(key, value)
  }

  let replaceAndDeleteNamedParam = function (key, value) {
    route = route.replace(':' + key, value)
    delete copiedParams[key]
  }

  let constructQueryString = function () {
    let validParams = _.omitBy(copiedParams, _.isEmpty, _.isUndefined)
    if (Object.keys(validParams).length === 0) return ''
    return ['?', querystring.stringify(validParams)].join('')
  }

  return init()
}
