// Comando personalizado para hacer login programáticamente.
// Los tipos de este comando están declarados en cypress/support/index.d.ts
Cypress.Commands.add('loginByToken', (token: string) => {
    cy.window().then((win) => {
        win.localStorage.setItem('token', token);
    });
});
