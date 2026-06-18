export {};

const EMAIL = `e2e_company_${Date.now()}@test.com`;
const PASSWORD = 'Password123!';
const API = 'http://127.0.0.1:3000';

describe('Company', () => {
    before(() => {
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

    it('searches for a company, navigates to its detail and renders data', () => {
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="search-submit"]').click();
        
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 15000 }).click();
        
        cy.url().should('include', '/companies/AAPL');
        cy.get('h1', { timeout: 20000 }).contains('AAPL');
        
        cy.get('[data-cy="metrics-section"]').contains('REVENUE', { matchCase: false });
        cy.get('[data-cy="metrics-section"]').contains('NET INCOME', { matchCase: false });
        cy.get('[data-cy="metrics-section"]').contains('EPS', { matchCase: false });
        cy.get('[data-cy="metrics-section"]').contains('TOTAL ASSETS', { matchCase: false });
        
        cy.get('[data-cy="filings-section"]').contains('Ver filing →');
    });

    it('searches for a non-existent company and shows not found message', () => {
        cy.get('[data-cy="ticker-search"]').type('NONEXISTENTCOMPANY123');
        cy.get('[data-cy="search-submit"]').click();

        cy.get('body', { timeout: 15000 }).contains('No se encontraron resultados para "NONEXISTENTCOMPANY123".');
    });

    it('attempts to access an invalid company via url and shows error', () => {
        cy.visit('/companies/FAKECOMPANY12345');
        cy.get('body', { timeout: 15000 }).contains('No se pudo cargar la información financiera de esta empresa.');
    });

    it('renders empty states when a company exists but has no filings or historical metrics', () => {
        cy.intercept('GET', '**/companies/AAPL/filings', { body: [] }).as('getFilingsEmpty');
        cy.intercept('GET', '**/companies/AAPL/historical-metrics', { body: {} }).as('getHistoryEmpty');
        
        cy.visit('/companies/AAPL');
        
        cy.wait(['@getFilingsEmpty', '@getHistoryEmpty']);
        
        cy.get('body').contains('No hay datos históricos suficientes para graficar.');
        cy.get('[data-cy="filings-section"]').contains('No hay filings recientes disponibles.');
    });
});