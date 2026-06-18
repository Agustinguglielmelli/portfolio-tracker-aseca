export {};

const EMAIL = 'e2e_company@test.com';
const PASSWORD = 'Password123!';
const API = 'http://127.0.0.1:3002';

describe('Company', () => {
    before(() => {
        cy.task('db:deleteUser', EMAIL);
        cy.request('POST', `${API}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            confirmPassword: PASSWORD,
        });
    });

    beforeEach(() => {
        cy.session(EMAIL, () => {
            cy.loginByApi(EMAIL, PASSWORD);
        });

        cy.visit('/search');
    });

    it('busca una empresa, navega a su detalle y renderiza los datos', () => {
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="search-submit"]').click();

        // Timeout para el rate limit
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 15000 }).click();


        cy.url().should('include', '/companies/AAPL');
        cy.get('body').contains('Cargando datos de AAPL...');
        cy.get('h1', { timeout: 20000 }).contains('AAPL');

        cy.get('[data-cy="metrics-section"]').contains('REVENUE', { matchCase: false });
        cy.get('[data-cy="metrics-section"]').contains('NET INCOME', { matchCase: false });
        cy.get('[data-cy="metrics-section"]').contains('EPS', { matchCase: false });
        cy.get('[data-cy="metrics-section"]').contains('TOTAL ASSETS', { matchCase: false });

        cy.get('[data-cy="filings-section"]').contains('Ver filing →');
    });
});