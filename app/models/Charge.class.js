'use strict'

/**
 @class Charage
 */
class Charge {
  /**
   * @param {Object} chargeData
   * @returns Charge
   */
  constructor (chargeData) {
    console.log(`chargeData = ${JSON.stringify(chargeData)}`)
    this.externalChargeId = chargeData.external_charge_id
    this.description = chargeData.description
    this.amount = chargeData.amount
    this.externalProductId = chargeData.external_product_id
    this.selfLink = chargeData._links.find(link => link.rel === 'self')
    this.nextLink = chargeData._links.find(link => link.rel === 'next')
  }

  /**
   * @method toJson
   * @returns {Object} json representation of the Charge
   */
  toJson () {
    return {
      external_charge_id: this.externalChargeId,
      description: this.description,
      amount: this.amount,
      external_product_id: this.externalProductId,
      _links: [this.selfLink, this.nextLink]
    }
  }
}

module.exports = Charge
