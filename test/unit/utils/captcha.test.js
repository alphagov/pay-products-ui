const { expect } = require('chai')
const nock = require('nock')

const captcha =  require('../../../app/utils/captcha')

describe('CAPTCHA verification utility', () => {
  it('rejects non-success HTTP responses', async () => {
    nock('https://www.google.com').post('/recaptcha/api/siteverify').reply(403)

    try {
      await captcha.verifyCAPTCHAToken('a-token')
    } catch (error) {
      expect(error).to.have.property('message', 'Unknown reCAPTCHA response 403')
    }
  })

  it('passes the provided token and environment secret in an expected format', async () => {
    const token = 'a-valid-session-token'
    nock('https://www.google.com')
      .post('/recaptcha/api/siteverify', (body) => {
        // Google verify endpoint expects POST body with multipart/form-data content type
        return [ 'secret', '8Pf-i72rjkwfmjwfi72rfkjwefmjwef', 'response', token ].every((expectedValue) => body.includes(expectedValue))
      })
      .reply(200, { success: true })
    const validResponseWithExpectedBody = await captcha.verifyCAPTCHAToken(token)
    expect(validResponseWithExpectedBody).to.equal(true)
  })

  it('resolves truthy given a successful response from verify route', async () => {
    nock('https://www.google.com').post('/recaptcha/api/siteverify').reply(200, { success: true })
    const valid = await captcha.verifyCAPTCHAToken('a-token')
    expect(valid).to.equal(true)
  })

  it('resolves falsey given an unsuccessful response from verify route', async () => {
    nock('https://www.google.com').post('/recaptcha/api/siteverify').reply(200, { success: false })
    const valid = await captcha.verifyCAPTCHAToken('a-token')
    expect(valid).to.equal(false)
  })
})