const request = require('request')
const logger = require('./logger')(__filename)
const urlJoin = require('url-join')

const {
  GOOGLE_RECAPTCHA_SECRET_KEY,
  GOOGLE_RECAPTCHA_SITE_KEY,
  GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION,
  GOOGLE_RECAPTCHA_ENTERPRISE_PROJECT_ID
} = process.env
const HTTP_SUCCESS_CODE = 200
const captchaEnterpriseUrl = formatEnterpriseUrl(GOOGLE_RECAPTCHA_ENTERPRISE_PROJECT_ID)
const captchaBasicUrl = 'https://www.recaptcha.net/recaptcha/api/siteverify'

function formatEnterpriseUrl(projectId) {
  return urlJoin('https://recaptchaenterprise.googleapis.com/v1beta1/projects', String(projectId), 'assessments')
}

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
      url: captchaEnterpriseUrl,
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
      url: captchaBasicUrl,
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

module.exports = {
  verifyCAPTCHAToken: GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION === 'true' ? verifyCAPTCHAEnterpriseVersion : verifyCAPTCHATokenBasicVersion,
  formatEnterpriseUrl
}