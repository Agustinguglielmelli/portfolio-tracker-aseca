// US 3.4 — Tests E2E del Dashboard: widget de última actualización de precios
describe('Dashboard - Última actualización de precios (US 3.4)', () => {
    beforeEach(() => {
        // Simular sesión iniciada inyectando token ADMIN en localStorage
        const adminJwt = 'header.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AdHJhY2tlci5jb20iLCJyb2xlIjoiQURNSU4ifQ==.signature';
        cy.loginByToken(adminJwt);

        // Interceptar GET /prices/last-update con respuesta por defecto (sobreescribible por cada test)
        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: new Date().toISOString(),
                message: 'OK',
                tickersProcessed: 0,
                success: 0,
                errors: 0,
                details: [],
            },
        }).as('getPricesUpdate');

        cy.visit('/admin/dashboard');
    });

    // ── Test 1: Timestamp reciente ────────────────────────────────────────────

    it('debería mostrar el timestamp formateado cuando hay precios recientes', () => {
        // US 3.4
        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: new Date().toISOString(),
                message: 'Precios actualizados correctamente.',
                tickersProcessed: 2,
                success: 2,
                errors: 0,
                details: [
                    { ticker: 'AAPL', price: 190.5 },
                    { ticker: 'MSFT', price: 310.0 },
                ],
            },
        }).as('getPricesUpdate');

        cy.visit('/admin/dashboard');
        cy.wait('@getPricesUpdate');

        // El widget principal debe ser visible
        cy.get('#last-update-widget').should('be.visible');

        // El timestamp debe estar visible y contener algún texto
        cy.get('#last-update-timestamp')
            .should('be.visible')
            .invoke('text')
            .should('not.be.empty');

        // No debe mostrarse ninguna advertencia cuando los datos son recientes
        cy.get('#no-prices-warning').should('not.exist');
        cy.get('#stale-data-warning').should('not.exist');

        // La tabla de tickers debe ser visible con AAPL y MSFT
        cy.get('table').should('be.visible');
        cy.get('table').contains('AAPL').should('be.visible');
        cy.get('table').contains('MSFT').should('be.visible');
    });

    // ── Test 2: Sin precios registrados ──────────────────────────────────────

    it('debería mostrar el banner de advertencia cuando no hay precios registrados', () => {
        // US 3.4
        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: null,
                message: 'No hay precios registrados. El batch nunca fue ejecutado.',
                tickersProcessed: 0,
                success: 0,
                errors: 0,
                details: [],
            },
        }).as('getPricesUpdate');

        cy.visit('/admin/dashboard');
        cy.wait('@getPricesUpdate');

        // El banner de "sin precios" debe ser visible // US 3.4
        cy.get('#no-prices-warning').should('be.visible');
        cy.contains('No hay precios registrados').should('be.visible');

        // El timestamp no debe existir porque no hay datos
        cy.get('#last-update-timestamp').should('not.exist');

        // No debe mostrarse la advertencia de datos desactualizados
        cy.get('#stale-data-warning').should('not.exist');
    });

    // ── Test 3: Datos con más de 24 horas de antigüedad ──────────────────────

    it('debería mostrar indicador de datos desactualizados cuando los precios tienen más de 24 horas', () => {
        // US 3.4
        // Calcular timestamp 25 horas atrás para garantizar que isStale() devuelva true
        const staleTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();

        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: staleTimestamp,
                message: 'Precios desactualizados.',
                tickersProcessed: 1,
                success: 1,
                errors: 0,
                details: [{ ticker: 'AAPL', price: 190.5 }],
            },
        }).as('getPricesUpdate');

        cy.visit('/admin/dashboard');
        cy.wait('@getPricesUpdate');

        // El banner de datos desactualizados debe ser visible // US 3.4
        cy.get('#stale-data-warning').should('be.visible');
        cy.contains('más de 24 horas').should('be.visible');

        // El timestamp debe seguir visible (los datos se muestran aunque estén desactualizados)
        cy.get('#last-update-timestamp').should('be.visible');

        // El banner de "sin precios" no debe existir
        cy.get('#no-prices-warning').should('not.exist');
    });

    // ── Test 4: Recarga de pantalla ───────────────────────────────────────────

    it('debería actualizar la información al recargar la pantalla', () => {
        // US 3.4
        // Primera carga: sin precios registrados
        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: null,
                message: 'No hay precios registrados. El batch nunca fue ejecutado.',
                tickersProcessed: 0,
                success: 0,
                errors: 0,
                details: [],
            },
        }).as('getPricesUpdate');

        cy.visit('/admin/dashboard');
        cy.wait('@getPricesUpdate');

        // En la primera carga debe mostrarse el banner de "sin precios"
        cy.get('#no-prices-warning').should('be.visible');

        // Segunda carga tras recarga: ahora hay un timestamp válido
        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: new Date().toISOString(),
                message: 'Precios actualizados correctamente.',
                tickersProcessed: 1,
                success: 1,
                errors: 0,
                details: [{ ticker: 'AAPL', price: 190.5 }],
            },
        }).as('getPricesUpdateReload');

        cy.reload();
        cy.wait('@getPricesUpdateReload');

        // Tras la recarga el timestamp debe aparecer y el banner de "sin precios" desaparecer
        cy.get('#last-update-timestamp').should('be.visible');
        cy.get('#no-prices-warning').should('not.exist');
    });

    // ── Test 5: Estado por ticker en la tabla ─────────────────────────────────

    it('debería mostrar el estado por ticker en la tabla', () => {
        // US 3.4
        cy.intercept('GET', '**/prices/last-update', {
            statusCode: 200,
            body: {
                lastUpdate: new Date().toISOString(),
                message: 'Precios actualizados con errores.',
                tickersProcessed: 2,
                success: 1,
                errors: 1,
                details: [
                    { ticker: 'AAPL', price: 190.5 },
                    { ticker: 'TSLA', error: 'Could not retrieve price' },
                ],
            },
        }).as('getPricesUpdate');

        cy.visit('/admin/dashboard');
        cy.wait('@getPricesUpdate');

        // AAPL debe aparecer en la tabla con estado OK
        cy.get('table').contains('AAPL').should('be.visible');
        cy.get('table').contains('OK').should('be.visible');

        // TSLA debe aparecer en la tabla con estado ERROR
        cy.get('table').contains('TSLA').should('be.visible');
        cy.get('table').contains('ERROR').should('be.visible');
    });

    // ── Test 6: Redirección sin token ─────────────────────────────────────────

    it('debería redirigir al login si no hay token de autenticación', () => {
        // US 3.4
        // Limpiar localStorage para simular usuario no autenticado
        cy.clearLocalStorage();

        cy.visit('/admin/dashboard');

        // La ruta protegida debe redirigir a /login
        cy.url().should('include', '/login');
    });
});
