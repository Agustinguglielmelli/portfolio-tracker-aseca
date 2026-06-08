const EMAIL = 'e2e_portfolio@test.com';
const PASSWORD = 'Password123!';
const API = 'http://localhost:3000';

// Helper: comprar via API sin pasar por ui asi por ej en los sell no tengo que comprar de nuevo por ui
const buyViaApi = (ticker: string, quantity: number) =>
    cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        cy.request({
            method: 'POST',
            url: `${API}/portfolio/buy`,
            headers: { Authorization: `Bearer ${token}` },
            body: { ticker, quantity, date: '2026-01-01' },
        });
    });

describe('Portfolio', () => {
    before(() => {
        cy.task('db:deleteUser', EMAIL);
        cy.request('POST', `${API}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            confirmPassword: PASSWORD,
        });

        // Asegurar que AAPL tiene precio en la DB de test
        cy.task('db:upsertStockPrice', { ticker: 'AAPL', price: 150 });
    });

    beforeEach(() => {
        cy.task('db:deleteUserTransactions', EMAIL);

        cy.session(EMAIL, () => {
            cy.loginByApi(EMAIL, PASSWORD);
        });

        cy.visit('/dashboard');
    });

    it('muestra el estado vacío cuando no hay posiciones', () => {
        cy.get('[data-cy="portfolio-empty"]').should('be.visible');
    });

    it('registra una compra desde la UI y muestra la posición', () => {
        cy.get('[data-cy="trade-button"]').click();

        cy.get('[data-cy="trade-type-buy"]').click();
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();
        cy.get('[data-cy="selected-ticker"]').should('contain', 'AAPL');

        cy.get('[data-cy="quantity-input"]').type('10');
        cy.get('[data-cy="trade-submit"]').click();

        cy.get('[data-cy="position-row-AAPL"]').should('be.visible');
        cy.get('[data-cy="position-row-AAPL"]').should('contain', '10');
    });

    it('registra una venta y actualiza la posición', () => {
        buyViaApi('AAPL', 10);
        cy.reload();

        cy.get('[data-cy="position-row-AAPL"]').should('be.visible');

        cy.get('[data-cy="trade-button"]').click();
        cy.get('[data-cy="trade-type-sell"]').click();
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();

        cy.get('[data-cy="quantity-input"]').type('5');
        cy.get('[data-cy="trade-submit"]').click();

        cy.get('[data-cy="position-row-AAPL"]').should('contain', '5');
    });

    it('vender todo cierra la posición', () => {
        buyViaApi('AAPL', 10);
        cy.reload();

        cy.get('[data-cy="trade-button"]').click();
        cy.get('[data-cy="trade-type-sell"]').click();
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();

        cy.get('[data-cy="quantity-input"]').type('10');
        cy.get('[data-cy="trade-submit"]').click();

        cy.get('[data-cy="portfolio-empty"]').should('be.visible');
    });

    it('muestra error al intentar vender más de lo disponible', () => {
        buyViaApi('AAPL', 5);
        cy.reload();

        cy.get('[data-cy="trade-button"]').click();
        cy.get('[data-cy="trade-type-sell"]').click();
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();

        cy.get('[data-cy="quantity-input"]').type('20');
        cy.get('[data-cy="trade-submit"]').click();

        cy.get('[data-cy="trade-error"]').should('be.visible');
    });

    it('muestra el historial de transacciones', () => {
        buyViaApi('AAPL', 10);
        cy.reload();

        cy.get('[data-cy="history-toggle"]').click();
        cy.get('[data-cy="transaction-row"]').should('have.length', 1);
        cy.get('[data-cy="transaction-row"]').should('contain', 'AAPL');
    });
});
