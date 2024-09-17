const { expect } = require('chai')
const nock = require('nock')

const captcha = require('./captcha')

describe('CAPTCHA verification utility', () => {
  describe('Basic CAPTCHA', () => {
    it('rejects non-success HTTP responses', async () => {
      nock('https://www.recaptcha.net').post('/recaptcha/api/siteverify').reply(403)

      try {
        await captcha.verifyCAPTCHAToken('a-token')
      } catch (error) {
        expect(error).to.have.property('message', 'Request failed with status code 403')
      }
    })

    it('passes the provided token and environment secret in an expected format', async () => {
      const token = 'a-valid-session-token'
      nock('https://www.recaptcha.net')
        .post('/recaptcha/api/siteverify', (body) => {
          // Google verify endpoint expects POST body with multipart/form-data content type
          return ['secret', '8Pf-i72rjkwfmjwfi72rfkjwefmjwef', 'response', token].every((expectedValue) => body.includes(expectedValue))
        })
        .reply(200, { success: true })
      const validResponseWithExpectedBody = await captcha.verifyCAPTCHAToken(token)
      expect(validResponseWithExpectedBody).to.equal(true)
    })

    it('resolves truthy given a successful response from verify route', async () => {
      nock('https://www.recaptcha.net').post('/recaptcha/api/siteverify').reply(200, { success: true })
      const valid = await captcha.verifyCAPTCHAToken('a-token')
      expect(valid).to.equal(true)
    })

    it('resolves falsey given an unsuccessful response from verify route', async () => {
      nock('https://www.recaptcha.net').post('/recaptcha/api/siteverify').reply(200, { success: false })
      const valid = await captcha.verifyCAPTCHAToken('a-token')
      expect(valid).to.equal(false)
    })

    it('returns the captcha enterprise URL given a valid project ID', () => {
      expect(captcha.formatEnterpriseUrl('102030')).to.equal('https://recaptchaenterprise.googleapis.com/v1/projects/102030/assessments')
    })
  })

  describe('Entreprise CAPTCHA', () => {
    afterEach(() => {
      process.env.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION = undefined
    })

    it('rejects non-success HTTP responses', async () => {
      process.env.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION = 'true'
      nock('https://recaptchaenterprise.googleapis.com')
        .post('/v1/projects/102030/assessments?key=8Pf-i72rjkwfmjwfi72rfkjwefmjwef')
        .reply(403)

      try {
        await captcha.verifyCAPTCHAToken('a-token')
      } catch (error) {
        expect(error).to.have.property('message', 'Request failed with status code 403')
      }
    })

    it('passes the provided token and environment secret in an expected format', async () => {
      process.env.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION = 'true'

      const token = 'a-valid-session-token'

      nock('https://recaptchaenterprise.googleapis.com')
        .post('/v1/projects/102030/assessments?key=8Pf-i72rjkwfmjwfi72rfkjwefmjwef', (body) => {
          if (body.event.token === token) {
            return true
          } else {
            return false
          }
        })
        .reply(200, { riskAnalysis: { success: true, score: 1 } })

      const validResponseWithExpectedBody = await captcha.verifyCAPTCHAToken(token)
      expect(validResponseWithExpectedBody).to.equal(true)
    })

    it('CAPTCHA fails when the body score is < 0.9', async () => {
      process.env.GOOGLE_RECAPTCHA_USE_ENTERPRISE_VERSION = 'true'

      const token = 'a-valid-session-token'

      nock('https://recaptchaenterprise.googleapis.com')
        .post('/v1/projects/102030/assessments?key=8Pf-i72rjkwfmjwfi72rfkjwefmjwef', (body) => {
          if (body.event.token === token) {
            return true
          } else {
            return false
          }
        })
        .reply(200, { riskAnalysis: { success: true, score: 0.8 } })

      const validResponseWithExpectedBody = await captcha.verifyCAPTCHAToken(token)
      expect(validResponseWithExpectedBody).to.equal(false)
    })
  })
})
