// Declaración de tipos para los comandos personalizados de Cypress.
// Este archivo .d.ts es incluido automáticamente por el tsconfig de Cypress,
// lo que garantiza que cy.loginByToken() sea reconocido en todos los specs.
declare namespace Cypress {
    interface Chainable {
        loginByToken(token: string): Chainable<void>;
        loginByApi(email: string, password: string): Chainable<void>;
    }
}
