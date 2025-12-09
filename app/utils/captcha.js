const axios = require('axios')
const logger = require('./logger')(__filename)
const urlJoin = require('url-join')

const {
  GOOGLE_RECAPTCHA_SECRET_KEY,
  GOOGLE_RECAPTCHA_SITE_KEY,
  GOOGLE_RECAPTCHA_ENTERPRISE_PROJECT_ID
} = process.env
const HTTP_SUCCESS_CODE = 200
const captchaEnterpriseUrl = formatEnterpriseUrl(GOOGLE_RECAPTCHA_ENTERPRISE_PROJECT_ID)
const captchaBasicUrl = 'https://www.recaptcha.net/recaptcha/api/siteverify'

function formatEnterpriseUrl (projectId) {
  return urlJoin('https://recaptchaenterprise.googleapis.com/v1/projects', String(projectId), 'assessments')
}

async function verifyCAPTCHAEnterpriseVersion (token) {
  if (!GOOGLE_RECAPTCHA_SECRET_KEY) {
    throw new Error('reCAPTCHA secret key not set in environment')
  }

  if (!token) {
    logger.warn('no reCAPTCHA enterprise widget token response provided')
    return false
  }

  const response = await axios.post(
    captchaEnterpriseUrl,
    {
      event: {
        token,
        siteKey: GOOGLE_RECAPTCHA_SITE_KEY
      }
    },
    {
      params: {
        key: GOOGLE_RECAPTCHA_SECRET_KEY
      }
    }
  )

  // https://cloud.google.com/recaptcha/docs/reference/rest/v1/projects.assessments
  if (response.status === HTTP_SUCCESS_CODE) {
    const body = response.data || {}
    const riskAnalysis = body.riskAnalysis || {}
    const score = riskAnalysis.score
    const reasons = riskAnalysis.reasons || []

    if (typeof score !== 'number') {
      logger.warn('Failed reCAPTCHA response (not a number)', {
        tokenProperties: body.tokenProperties || {},
        score: score || 'N/A',
        reasons
      })
      return false
    }

    if (score < 0.5) {
      logger.info('Failed reCAPTCHA response (Low Score)', {
        tokenProperties: body.tokenProperties || {},
        score: score,
        reasons
      })
      return false
    }

    logger.info('Successful reCAPTCHA response', {
      tokenProperties: body.tokenProperties || {},
      score: score || 'N/A',
      reasons
    })
    return true
  }
  throw new Error(`Unknown reCAPTCHA response ${response.statusCode}`)
}

async function verifyCAPTCHATokenBasicVersion (token) {
  if (!GOOGLE_RECAPTCHA_SECRET_KEY) {
    throw new Error('reCAPTCHA secret key not set in environment')
  }
  if (!token) {
    throw new Error('no reCAPTCHA widget token response provided')
  }

  const form = new FormData() // eslint-disable-line
  form.append('secret', GOOGLE_RECAPTCHA_SECRET_KEY)
  form.append('response', token)

  const response = await axios.post(
    captchaBasicUrl,
    form
  )

  if (response.status === HTTP_SUCCESS_CODE) {
    const body = response.data
    if (body.success !== true) {
      logger.info('Failed reCAPTCHA response', {
        errorCodes: body['error-codes']
      })
    }
    return body.success
  }

  throw new Error(`Unknown reCAPTCHA response ${response.statusCode}`)
}

async function verifyCAPTCHAToken (token) {
  if (process.env.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION === 'true') {
    return await verifyCAPTCHAEnterpriseVersion(token)
  } else {
    return await verifyCAPTCHATokenBasicVersion(token)
  }
}

module.exports = {
  verifyCAPTCHAToken,
  formatEnterpriseUrl
}
