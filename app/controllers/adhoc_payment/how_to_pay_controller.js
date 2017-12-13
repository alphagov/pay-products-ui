'use strict'

const HOW_TO_PAY_VIEW = 'adhoc_payment/how-to-pay'

module.exports = (req, res) => {
  res
    .status(200)
    .render(HOW_TO_PAY_VIEW)
}
