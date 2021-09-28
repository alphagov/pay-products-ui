const request = require('request')
const logger = require('./logger')(__filename)

const {
  GOOGLE_RECAPTCHA_SECRET_KEY,
  GOOGLE_RECAPTCHA_VERIFY_URL,
  GOOGLE_RECAPTCHA_SITE_KEY,
  GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION
} = process.env
const HTTP_SUCCESS_CODE = 200

function verifyCAPTCHAEnterpriseVersion(token) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_RECAPTCHA_SECRET_KEY) {
      reject(new Error('reCAPTCHA secret key not set in environment'))
      return
    }
    if(!token) {
      reject(new Error('no reCAPTCHA enterprise widget token response provided'))
      return
    }
    request.post({
      url: GOOGLE_RECAPTCHA_VERIFY_URL,
      proxy: process.env.http_proxy,
      qs: {
        key: GOOGLE_RECAPTCHA_SECRET_KEY
      },
      body: {
        event: {
          token: token,
          siteKey: GOOGLE_RECAPTCHA_SITE_KEY
        }
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(error)
        return
      }
      if (response.statusCode === HTTP_SUCCESS_CODE) {
        // https://cloud.google.com/recaptcha-enterprise/docs/interpret-assessment
        if (!body.score || body.score < 0.9) {
          logger.info('Failed reCAPTCHA response', {
            tokenProperties: body.tokenProperties,
            score: body.score,
            reasons: body.reasons
          })
        }
        resolve(true)
        return
      }
      reject(new Error(`Unknown reCAPTCHA response ${response.statusCode}`))
    })
  })
}

function verifyCAPTCHATokenBasicVersion(token) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_RECAPTCHA_SECRET_KEY) {
      reject(new Error('reCAPTCHA secret key not set in environment'))
      return
    }
    if(!token) {
      reject(new Error('no reCAPTCHA widget token response provided'))
      return
    }
    request.post({
      url: GOOGLE_RECAPTCHA_VERIFY_URL,
      proxy: process.env.http_proxy,
      formData: {
        secret: GOOGLE_RECAPTCHA_SECRET_KEY,
        response: token
      },
      json: true
    }, (error, response, body) => {
      if (error) {
        reject(error)
        return
      }
      if (response.statusCode === HTTP_SUCCESS_CODE) {
        if (body.success !== true) {
          logger.info('Failed reCAPTCHA response', {
            errorCodes: body['error-codes']
          })
        }
        resolve(body.success)
        return
      }
      reject(new Error(`Unknown reCAPTCHA response ${response.statusCode}`))
    })
  })
}

module.exports = { verifyCAPTCHAToken: GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION === 'true' ? verifyCAPTCHAEnterpriseVersion : verifyCAPTCHATokenBasicVersion }