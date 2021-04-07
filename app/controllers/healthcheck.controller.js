'use strict'

module.exports = (req, res) => {
  res.json({ 'ping': { 'healthy': true } })
}
