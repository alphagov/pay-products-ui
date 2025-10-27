const helmet = require('helmet')
const paths = require('../paths')

const sendCspHeader = process.env.CSP_SEND_HEADER === 'true'
const enforceCsp = process.env.CSP_ENFORCE === 'true'
const productsUiUrl = process.env.PRODUCTS_UI_URL || ''
// Script responsible for setting 'js-enabled' class, extends GOV.UK frontend `layout` which we have no control over
// and never changes
const govUkFrontendLayoutJsEnabledScriptHash = '\'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw=\''

const CSP_NONE = ['\'none\'']
const CSP_SELF = ['\'self\'']

const scriptSource = ['\'self\'', govUkFrontendLayoutJsEnabledScriptHash]

const reportingEndpointName = 'govukpay-csp-reporting'

const skipSendingCspHeader = (req, res, next) => { next() }

const productsUiCsp = helmet({
  contentSecurityPolicy: {
    directives: {
      reportUri: [paths.csp.path],
      reportTo: [reportingEndpointName],
      frameSrc: CSP_SELF,
      childSrc: CSP_SELF,
      imgSrc: CSP_SELF,
      scriptSrc: scriptSource,
      connectSrc: CSP_SELF,
      styleSrc: CSP_SELF,
      formAction: CSP_SELF,
      fontSrc: CSP_SELF,
      frameAncestors: CSP_SELF,
      manifestSrc: CSP_SELF,
      mediaSrc: CSP_NONE,
      objectSrc: CSP_NONE,
      baseUri: CSP_NONE
    },
    reportOnly: !enforceCsp
  }
})

const setReportingEndpoints = (req, res, next) => {
  res.setHeader('Reporting-Endpoints', `${reportingEndpointName}="${productsUiUrl}${paths.csp.path}"`)
  next()
}

module.exports = {
  setReportingEndpoints: sendCspHeader ? setReportingEndpoints : skipSendingCspHeader,
  cardDetails: sendCspHeader ? productsUiCsp : skipSendingCspHeader
}
