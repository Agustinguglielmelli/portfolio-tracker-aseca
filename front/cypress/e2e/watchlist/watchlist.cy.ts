export {};

const EMAIL = 'e2e_watchlist@test.com';
const PASSWORD = 'Password123!';
const API = 'http://localhost:3000';

describe('Watchlist', () => {
    before(() => {
        cy.request({
            method: 'POST',
            url: `${API}/auth/login`,
            body: {
                email: 'admin@admin.com',
                password: 'admin123'    
            }
        }).then((response) => {
            const adminToken = response.body.token || response.body.access_token;
            cy.request({
                method: 'POST',
                url: `${API}/prices/update`,
                headers: { Authorization: `Bearer ${adminToken}` },
                timeout: 120000
            });
        });
        cy.task('db:deleteUser', EMAIL);
        cy.request('POST', `${API}/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            confirmPassword: PASSWORD,
        });

        cy.task('db:upsertStockPrice', { ticker: 'AAPL', price: 150 });
        cy.task('db:upsertStockPrice', { ticker: 'MSFT', price: 300 });
    });

    beforeEach(() => {
        cy.task('db:deleteUserWatchlist', EMAIL);

        cy.session(EMAIL, () => {
            cy.loginByApi(EMAIL, PASSWORD);
        });

        cy.visit('/watchlist');
    });

    it('agrega empresas a la watchlist', () => {
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();
        cy.get('[data-cy="add-to-watchlist"]').click();
        cy.get('[data-cy="watchlist-item-AAPL"]').should('be.visible');

        cy.get('[data-cy="ticker-search"]').clear().type('Microsoft');
        cy.get('[data-cy="ticker-option-MSFT"]', { timeout: 8000 }).click();
        cy.get('[data-cy="add-to-watchlist"]').click();
        cy.get('[data-cy="watchlist-item-MSFT"]').should('be.visible');
    });

    it('compara empresas en la watchlist', () => {
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();
        cy.get('[data-cy="add-to-watchlist"]').click();

        cy.get('[data-cy="ticker-search"]').clear().type('Microsoft');
        cy.get('[data-cy="ticker-option-MSFT"]', { timeout: 8000 }).click();
        cy.get('[data-cy="add-to-watchlist"]').click();

        cy.get('[data-cy="watchlist-item-AAPL"]').should('contain', 'AAPL');
        cy.get('[data-cy="watchlist-item-MSFT"]').should('contain', 'MSFT');

        cy.get('[data-cy="watchlist-checkbox-AAPL"]').check();
        cy.get('[data-cy="watchlist-checkbox-MSFT"]').check();

        cy.get('[data-cy="watchlist-comparison"]').should('be.visible');
    });

    it('elimina una empresa de la watchlist', () => {
        cy.get('[data-cy="ticker-search"]').type('Apple');
        cy.get('[data-cy="ticker-option-AAPL"]', { timeout: 8000 }).click();
        cy.get('[data-cy="add-to-watchlist"]').click();
        cy.get('[data-cy="watchlist-item-AAPL"]').should('be.visible');

        cy.get('[data-cy="remove-watchlist-AAPL"]').click();
        cy.get('[data-cy="watchlist-item-AAPL"]').should('not.exist');
    });
});