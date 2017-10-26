'use strict'

/**
 @class Payment
 */
class Payment {
  /**
   * @param {Object} paymentData
   * @returns Payment
   */
  constructor (paymentData) {
    this.externalChargeId = paymentData.external_charge_id
    this.description = paymentData.description
    this.amount = paymentData.amount
    this.externalProductId = paymentData.external_product_id
    this.selfLink = paymentData._links.find(link => link.rel === 'self')
    this.nextLink = paymentData._links.find(link => link.rel === 'next')
  }

  /**
   * @method toJson
   * @returns {Object} json representation of the Payment
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

module.exports = Payment
