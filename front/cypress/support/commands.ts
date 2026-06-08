// Comando personalizado para hacer login programáticamente.
// Los tipos de este comando están declarados en cypress/support/index.d.ts
Cypress.Commands.add('loginByToken', (token: string) => {
    cy.window().then((win) => {
        win.localStorage.setItem('token', token);
    });
});

// Login via API — más rápido que llenar el formulario
Cypress.Commands.add('loginByApi', (email: string, password: string) => {
    cy.request('POST', 'http://localhost:3000/auth/login', { email, password }).then(({ body }) => {
        const token = body.token || body.access_token;
        cy.window().then((win) => win.localStorage.setItem('token', token));
    });
});
