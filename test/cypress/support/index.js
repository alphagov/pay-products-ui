// ***********************************************************
// This file is processed and loaded automatically before
// Cypress test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

beforeEach(() => {
  cy.task('clearStubs')
})

