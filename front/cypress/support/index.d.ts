// Declaración de tipos para los comandos personalizados de Cypress.
// Este archivo .d.ts es incluido automáticamente por el tsconfig de Cypress,
// lo que garantiza que cy.loginByToken() sea reconocido en todos los specs.
declare namespace Cypress {
    interface Chainable {
        /**
         * Inyecta un token JWT directamente en localStorage,
         * simulando una sesión iniciada sin pasar por el formulario de login.
         * @example cy.loginByToken('my-fake-token')
         */
        loginByToken(token: string): Chainable<void>;
    }
}
