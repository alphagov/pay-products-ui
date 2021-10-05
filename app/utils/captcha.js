const request = require('request')
const logger = require('./logger')(__filename)

const { GOOGLE_RECAPTCHA_SECRET_KEY, GOOGLE_RECAPTCHA_VERIFY_URL } = process.env
const HTTP_SUCCESS_CODE = 200

function verifyCAPTCHAToken(token) {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_RECAPTCHA_SECRET_KEY) {
      reject(new Error('reCAPTCHA secret key not set in environment'))
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

module.exports = { verifyCAPTCHAToken }