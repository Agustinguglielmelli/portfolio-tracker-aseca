describe('CompanySearch - Frontend', () => {
    beforeEach(() => {
        // Inyectamos un token para acceder a la página sin ser redirigidos
        cy.loginByToken('fake-token-test');
        cy.visit('/search');
    });

    // ── Estructura y UI inicial ───────────────────────────────────────────────

    it('debería renderizar el campo de búsqueda y el botón', () => {
        cy.get('input[type="text"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Buscar');
    });

    it('debería mostrar el placeholder correcto en el input de búsqueda', () => {
        cy.get('input[type="text"]').should(
            'have.attr',
            'placeholder',
            'Buscar por nombre o ticker (ej. AAPL, Apple)'
        );
    });

    it('no debería mostrar resultados ni mensajes al cargar por primera vez', () => {
        cy.contains('No se encontraron resultados').should('not.exist');
    });

    // ── Interacción con el input ──────────────────────────────────────────────

    it('debería permitir escribir en el campo de búsqueda', () => {
        cy.get('input[type="text"]').type('Apple');
        cy.get('input[type="text"]').should('have.value', 'Apple');
    });

    it('no debería hacer una petición si el campo está vacío', () => {
        cy.intercept('GET', '**/companies/search*').as('searchRequest');
        cy.get('button[type="submit"]').click();
        // La petición NO debería realizarse
        cy.get('@searchRequest.all').should('have.length', 0);
    });

    it('no debería hacer una petición si el campo contiene solo espacios', () => {
        cy.intercept('GET', '**/companies/search*').as('searchRequest');
        cy.get('input[type="text"]').type('   ');
        cy.get('button[type="submit"]').click();
        cy.get('@searchRequest.all').should('have.length', 0);
    });

    // ── Búsqueda con resultados ───────────────────────────────────────────────

    it('debería mostrar resultados cuando la API devuelve empresas', () => {
        const mockCompanies = [
            { cik: '0000320193', name: 'Apple Inc.', ticker: 'AAPL' },
            { cik: '0001652044', name: 'Alphabet Inc.', ticker: 'GOOGL' },
        ];

        cy.intercept('GET', '**/companies/search?q=Apple', {
            statusCode: 200,
            body: mockCompanies,
        }).as('searchApple');

        cy.get('input[type="text"]').type('Apple');
        cy.get('button[type="submit"]').click();

        cy.wait('@searchApple');

        cy.contains('Apple Inc.').should('be.visible');
        cy.contains('Alphabet Inc.').should('be.visible');
    });

    it('debería mostrar el ticker de cada empresa en los resultados', () => {
        const mockCompanies = [
            { cik: '0000320193', name: 'Apple Inc.', ticker: 'AAPL' },
        ];

        cy.intercept('GET', '**/companies/search?q=AAPL', {
            statusCode: 200,
            body: mockCompanies,
        }).as('searchAAPL');

        cy.get('input[type="text"]').type('AAPL');
        cy.get('button[type="submit"]').click();

        cy.wait('@searchAAPL');
        cy.contains('AAPL').should('be.visible');
        cy.contains('CIK: 0000320193').should('be.visible');
    });

    it('debería mostrar "N/A" cuando la empresa no tiene ticker', () => {
        const mockCompanies = [
            { cik: '0009999999', name: 'Empresa Sin Ticker', ticker: null },
        ];

        cy.intercept('GET', '**/companies/search?q=SinTicker', {
            statusCode: 200,
            body: mockCompanies,
        }).as('searchSinTicker');

        cy.get('input[type="text"]').type('SinTicker');
        cy.get('button[type="submit"]').click();

        cy.wait('@searchSinTicker');
        cy.contains('N/A').should('be.visible');
    });

    // ── Sin resultados ────────────────────────────────────────────────────────

    it('debería mostrar mensaje de "No se encontraron resultados" cuando la API devuelve lista vacía', () => {
        cy.intercept('GET', '**/companies/search?q=XYZInexistente', {
            statusCode: 200,
            body: [],
        }).as('searchVacio');

        cy.get('input[type="text"]').type('XYZInexistente');
        cy.get('button[type="submit"]').click();

        cy.wait('@searchVacio');
        cy.contains('No se encontraron resultados para "XYZInexistente".').should('be.visible');
    });

    // ── Navegación al detalle ─────────────────────────────────────────────────

    it('debería navegar a /companies/:ticker al hacer click en un resultado', () => {
        const mockCompanies = [
            { cik: '0000320193', name: 'Apple Inc.', ticker: 'AAPL' },
        ];

        cy.intercept('GET', '**/companies/search?q=Apple', {
            statusCode: 200,
            body: mockCompanies,
        }).as('searchApple');

        // Mock de las APIs que CompanyDetail necesita para no fallar al navegar
        cy.intercept('GET', '**/companies/AAPL/metrics', { statusCode: 200, body: {} }).as('metrics');
        cy.intercept('GET', '**/companies/AAPL/filings', { statusCode: 200, body: [] }).as('filings');
        cy.intercept('GET', '**/companies/AAPL/historical-metrics', { statusCode: 200, body: {} }).as('historical');

        cy.get('input[type="text"]').type('Apple');
        cy.get('button[type="submit"]').click();

        cy.wait('@searchApple');
        cy.contains('Apple Inc.').click();

        cy.url().should('include', '/companies/AAPL');
    });

    // ── Búsqueda con Enter ────────────────────────────────────────────────────

    it('debería ejecutar la búsqueda al presionar Enter en el input', () => {
        const mockCompanies = [
            { cik: '0000320193', name: 'Apple Inc.', ticker: 'AAPL' },
        ];

        cy.intercept('GET', '**/companies/search?q=Apple', {
            statusCode: 200,
            body: mockCompanies,
        }).as('searchEnter');

        cy.get('input[type="text"]').type('Apple{enter}');

        cy.wait('@searchEnter');
        cy.contains('Apple Inc.').should('be.visible');
    });
});
