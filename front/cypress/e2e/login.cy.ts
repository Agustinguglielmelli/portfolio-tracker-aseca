describe('Login Page', () => {
    beforeEach(() => {
        // Limpiar localStorage antes de cada test
        cy.clearLocalStorage();
        cy.visit('/login');
    });

    // ── Estructura y UI ──────────────────────────────────────────────────────

    it('debería renderizar el formulario de login con todos sus elementos', () => {
        cy.contains('Iniciar Sesión').should('be.visible');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Ingresar');
    });

    it('debería mostrar el link para registrarse', () => {
        cy.contains('¿No tenés cuenta?').should('be.visible');
        cy.contains('Registrate').should('be.visible').and('have.attr', 'href', '/register');
    });

    it('debería tener los placeholders correctos en los inputs', () => {
        cy.get('input[type="email"]').should('have.attr', 'placeholder', 'Email');
        cy.get('input[type="password"]').should('have.attr', 'placeholder', 'Contraseña');
    });

    it('debería tener los campos marcados como required', () => {
        cy.get('input[type="email"]').should('have.attr', 'required');
        cy.get('input[type="password"]').should('have.attr', 'required');
    });

    // ── Interacción del usuario ───────────────────────────────────────────────

    it('debería permitir escribir en el campo de email', () => {
        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="email"]').should('have.value', 'usuario@ejemplo.com');
    });

    it('debería permitir escribir en el campo de contraseña', () => {
        cy.get('input[type="password"]').type('miContraseña123');
        cy.get('input[type="password"]').should('have.value', 'miContraseña123');
    });

    it('debería navegar a /register al hacer click en "Registrate"', () => {
        cy.contains('Registrate').click();
        cy.url().should('include', '/register');
    });

    // ── Login exitoso (mock de API) ───────────────────────────────────────────

    it('debería redirigir al dashboard tras un login exitoso', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 200,
            body: { token: 'fake-jwt-token-12345' },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="password"]').type('contraseñaCorrecta');
        cy.get('button[type="submit"]').click();

        cy.wait('@loginRequest');
        cy.url().should('include', '/dashboard');
    });

    it('debería guardar el token en localStorage tras un login exitoso', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 200,
            body: { token: 'fake-jwt-token-12345' },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="password"]').type('contraseñaCorrecta');
        cy.get('button[type="submit"]').click();

        cy.wait('@loginRequest');
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.equal('fake-jwt-token-12345');
        });
    });

    it('debería soportar access_token como alternativa a token en la respuesta', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 200,
            body: { access_token: 'access-token-alternativo' },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="password"]').type('contraseñaCorrecta');
        cy.get('button[type="submit"]').click();

        cy.wait('@loginRequest');
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.equal('access-token-alternativo');
        });
    });

    // ── Login fallido (credenciales inválidas) ───────────────────────────────

    it('debería mostrar error de credenciales inválidas cuando el servidor responde 401', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 401,
            body: { message: 'Unauthorized' },
        }).as('loginFail');

        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="password"]').type('contraseñaIncorrecta');
        cy.get('button[type="submit"]').click();

        cy.wait('@loginFail');
        cy.contains('Credenciales inválidas').should('be.visible');
    });

    it('no debería redirigir al dashboard cuando las credenciales son inválidas', () => {
        cy.intercept('POST', '**/auth/login', {
            statusCode: 401,
            body: { message: 'Unauthorized' },
        }).as('loginFail');

        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="password"]').type('contraseñaIncorrecta');
        cy.get('button[type="submit"]').click();

        cy.wait('@loginFail');
        cy.url().should('include', '/login');
    });

    // ── Redirección cuando ya hay sesión ──────────────────────────────────────

    it('debería redirigir a / que a su vez va a /login cuando no hay token', () => {
        cy.visit('/');
        cy.url().should('include', '/login');
    });

    it('debería redirigir al dashboard si hay token y se visita /dashboard', () => {
        cy.loginByToken('valid-fake-token');
        cy.visit('/dashboard');
        cy.url().should('include', '/dashboard');
        cy.contains('Bienvenido al Dashboard').should('be.visible');
    });

    // ── Validación de longitud máxima (>256 caracteres) ───────────────────────
    it('debería mostrar error si el email supera los 256 caracteres', () => {
        const emailLargo = 'a'.repeat(250) + '@test.com'; // > 256 chars
        cy.get('input[type="email"]').invoke('val', emailLargo).trigger('input');
        // forzamos el valor directamente porque los inputs de tipo email validan formato
        cy.get('input[type="email"]').clear().type(emailLargo, { delay: 0 });
        cy.get('input[type="password"]').type('miContraseña123');
        cy.get('button[type="submit"]').click();
        cy.contains('El email y la contraseña no pueden superar los 256 caracteres.').should('be.visible');
    });
    it('debería mostrar error si la contraseña supera los 256 caracteres', () => {
        const passwordLarga = 'p'.repeat(257);
        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[type="password"]').type(passwordLarga, { delay: 0 });
        cy.get('button[type="submit"]').click();
        cy.contains('El email y la contraseña no pueden superar los 256 caracteres.').should('be.visible');
    });

});
