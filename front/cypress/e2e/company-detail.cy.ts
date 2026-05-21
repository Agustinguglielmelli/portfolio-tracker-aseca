// Datos mock reutilizables
const MOCK_METRICS = {
    revenue: 394328000000,
    netIncome: 96995000000,
    eps: 6.13,
    totalAssets: 352583000000,
};

const MOCK_FILINGS = [
    { accessionNumber: '0000320193-24-000123', type: '10-K', date: '2024-11-01' },
    { accessionNumber: '0000320193-24-000456', type: '10-Q', date: '2024-08-02' },
];

const MOCK_HISTORICAL = {
    revenue: [
        { date: '2023-Q1', value: 117154000000 },
        { date: '2023-Q2', value: 94836000000 },
        { date: '2024-Q1', value: 119575000000 },
    ],
    netIncome: [
        { date: '2023-Q1', value: 29959000000 },
        { date: '2023-Q2', value: 19881000000 },
        { date: '2024-Q1', value: 23636000000 },
    ],
    eps: [
        { date: '2023-Q1', value: 1.88 },
        { date: '2023-Q2', value: 1.26 },
        { date: '2024-Q1', value: 1.53 },
    ],
};

// Helper para interceptar las 3 APIs de CompanyDetail
const interceptCompanyApis = (ticker: string, overrides: Record<string, unknown> = {}) => {
    cy.intercept('GET', `**/companies/${ticker}/metrics`, {
        statusCode: 200,
        body: overrides.metrics ?? MOCK_METRICS,
    }).as('metrics');

    cy.intercept('GET', `**/companies/${ticker}/filings`, {
        statusCode: 200,
        body: overrides.filings ?? MOCK_FILINGS,
    }).as('filings');

    cy.intercept('GET', `**/companies/${ticker}/historical-metrics`, {
        statusCode: 200,
        body: overrides.historical ?? MOCK_HISTORICAL,
    }).as('historical');
};

describe('CompanyDetail - Frontend', () => {
    beforeEach(() => {
        cy.loginByToken('fake-token-test');
    });

    // ── Tests con datos AAPL por defecto (beforeEach compartido) ──────────────

    context('con datos de AAPL cargados correctamente', () => {
        beforeEach(() => {
            interceptCompanyApis('AAPL');
            cy.visit('/companies/AAPL');
            cy.wait(['@metrics', '@filings', '@historical']);
        });

        it('debería mostrar el título con el ticker de la empresa', () => {
            cy.contains('Detalle de AAPL').should('be.visible');
        });

        it('debería mostrar la sección de Métricas Actuales', () => {
            cy.contains('Métricas Actuales').should('be.visible');
        });

        it('debería mostrar las cuatro tarjetas de métricas', () => {
            cy.contains('Revenue').should('be.visible');
            cy.contains('Net Income').should('be.visible');
            cy.contains('EPS').should('be.visible');
            cy.contains('Total Assets').should('be.visible');
        });

        it('debería formatear correctamente los valores en miles de millones', () => {
            // Revenue: 394328000000 → $394.33B
            cy.contains('$394.33B').should('be.visible');
            // Net Income: 96995000000 → $97.00B
            cy.contains('$97.00B').should('be.visible');
            // EPS: 6.13 → $6.13 (menos de 1M, se formatea con toLocaleString)
            cy.contains('$6.13').should('be.visible');
        });

        it('debería mostrar la sección de Filings Recientes', () => {
            cy.contains('Filings Recientes (10-K / 10-Q)').should('be.visible');
        });

        it('debería listar los filings con tipo, número de acceso y fecha', () => {
            cy.contains('10-K').should('be.visible');
            cy.contains('10-Q').should('be.visible');
            cy.contains('Acc: 0000320193-24-000123').should('be.visible');
            cy.contains('2024-11-01').should('be.visible');
        });

        it('debería mostrar la sección de Evolución Histórica', () => {
            cy.contains('Evolución Histórica (Últimos Quarters)').should('be.visible');
        });

        it('debería renderizar el gráfico cuando hay datos históricos', () => {
            // Recharts renderiza un SVG
            cy.get('.recharts-responsive-container').should('exist');
            cy.get('svg').should('exist');
        });
    });

    // ── Tests con overrides o tickers distintos ───────────────────────────────

    it('debería mostrar "N/A" en métricas que son null', () => {
        interceptCompanyApis('AAPL', {
            metrics: { revenue: null, netIncome: null, eps: null, totalAssets: null },
        });
        cy.visit('/companies/AAPL');
        cy.wait(['@metrics', '@filings', '@historical']);

        cy.get('p.text-2xl').each(($el) => {
            cy.wrap($el).should('contain.text', 'N/A');
        });
    });

    it('debería mostrar mensaje cuando no hay filings disponibles', () => {
        interceptCompanyApis('AAPL', { filings: [] });
        cy.visit('/companies/AAPL');
        cy.wait(['@metrics', '@filings', '@historical']);
        cy.contains('No hay filings recientes disponibles.').should('be.visible');
    });

    it('debería mostrar mensaje cuando no hay datos históricos', () => {
        interceptCompanyApis('AAPL', { historical: {} });
        cy.visit('/companies/AAPL');
        cy.wait(['@metrics', '@filings', '@historical']);
        cy.contains('No hay datos históricos suficientes para graficar.').should('be.visible');
    });

    // ── Estado de carga ───────────────────────────────────────────────────────

    it('debería mostrar el estado de carga mientras se obtienen los datos', () => {
        // Retrasamos la respuesta para capturar el loading state
        cy.intercept('GET', '**/companies/TSLA/metrics', (req) => {
            req.reply({ delay: 500, statusCode: 200, body: MOCK_METRICS });
        }).as('slowMetrics');
        cy.intercept('GET', '**/companies/TSLA/filings', { statusCode: 200, body: MOCK_FILINGS }).as('filings');
        cy.intercept('GET', '**/companies/TSLA/historical-metrics', { statusCode: 200, body: MOCK_HISTORICAL }).as('historical');

        cy.visit('/companies/TSLA');
        cy.contains('Cargando datos de TSLA...').should('be.visible');
        cy.wait(['@slowMetrics', '@filings', '@historical']);
        cy.contains('Cargando datos de TSLA...').should('not.exist');
    });

    // ── Manejo de errores ─────────────────────────────────────────────────────

    it('debería mostrar mensaje de error cuando falla la carga de datos', () => {
        cy.intercept('GET', '**/companies/ERR/metrics', { statusCode: 500 }).as('metricsError');
        cy.intercept('GET', '**/companies/ERR/filings', { statusCode: 200, body: [] }).as('filings');
        cy.intercept('GET', '**/companies/ERR/historical-metrics', { statusCode: 200, body: {} }).as('historical');

        cy.visit('/companies/ERR');
        cy.wait('@metricsError');
        cy.contains('No se pudo cargar la información financiera de esta empresa.').should('be.visible');
    });

    it('debería mostrar error cuando el ticker es "null"', () => {
        cy.visit('/companies/null');
        cy.contains('Ticker inválido').should('be.visible');
    });

    // ── Diferentes tickers ────────────────────────────────────────────────────

    it('debería cargar correctamente datos para un ticker diferente (MSFT)', () => {
        interceptCompanyApis('MSFT', {
            metrics: { revenue: 211920000000, netIncome: 72361000000, eps: 9.72, totalAssets: 512163000000 },
        });
        cy.visit('/companies/MSFT');
        cy.wait(['@metrics', '@filings', '@historical']);
        cy.contains('Detalle de MSFT').should('be.visible');
        cy.contains('$211.92B').should('be.visible');
    });
});
