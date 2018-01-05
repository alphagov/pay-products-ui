'use strict'

module.exports = (req, res) => {
  res
    .status(200)
    .render('adhoc_payment/how-to-pay')
}
