'use strict'

class DomainError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class NotFoundError extends DomainError {
}

class AccountCannotTakePaymentsError extends DomainError {
}

module.exports = {
  NotFoundError,
  AccountCannotTakePaymentsError
}
