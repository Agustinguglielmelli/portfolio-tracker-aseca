describe('Register Page', () => {
    beforeEach(() => {
        // Limpiar localStorage antes de cada test
        cy.clearLocalStorage();
        cy.visit('/register');
    });

    // ── Estructura y UI ──────────────────────────────────────────────────────

    it('debería renderizar el formulario de registro con todos sus elementos', () => {
        cy.contains('Registro').should('be.visible');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[placeholder="Contraseña"]').should('be.visible');
        cy.get('input[placeholder="Confirmar Contraseña"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible').and('contain.text', 'Registrarse');
    });

    it('debería mostrar el link para iniciar sesión', () => {
        cy.contains('¿Ya tenés cuenta?').should('be.visible');
        cy.contains('Iniciá sesión').should('be.visible').and('have.attr', 'href', '/login');
    });

    it('debería tener los placeholders correctos en los inputs', () => {
        cy.get('input[type="email"]').should('have.attr', 'placeholder', 'Email');
        cy.get('input[placeholder="Contraseña"]').should('have.attr', 'placeholder', 'Contraseña');
        cy.get('input[placeholder="Confirmar Contraseña"]').should('have.attr', 'placeholder', 'Confirmar Contraseña');
    });

    it('debería tener los campos marcados como required', () => {
        cy.get('input[type="email"]').should('have.attr', 'required');
        cy.get('input[placeholder="Contraseña"]').should('have.attr', 'required');
        cy.get('input[placeholder="Confirmar Contraseña"]').should('have.attr', 'required');
    });

    // ── Interacción del usuario ───────────────────────────────────────────────

    it('debería navegar a /login al hacer click en "Iniciá sesión"', () => {
        cy.contains('Iniciá sesión').click();
        cy.url().should('include', '/login');
    });

    // ── Registro exitoso (mock de API) ───────────────────────────────────────────

    it('debería redirigir al dashboard tras un registro y login exitosos', () => {
        cy.intercept('POST', '**/auth/register', {
            statusCode: 201,
            body: { message: 'Usuario registrado correctamente' },
        }).as('registerRequest');

        cy.intercept('POST', '**/auth/login', {
            statusCode: 200,
            body: { token: 'fake-jwt-token-from-register' },
        }).as('loginRequest');

        cy.get('input[type="email"]').type('nuevo_usuario@ejemplo.com');
        cy.get('input[placeholder="Contraseña"]').type('MiContraseña123');
        cy.get('input[placeholder="Confirmar Contraseña"]').type('MiContraseña123');
        cy.get('button[type="submit"]').click();

        cy.wait('@registerRequest');
        cy.wait('@loginRequest');
        cy.url().should('include', '/dashboard');
        
        cy.window().then((win) => {
            expect(win.localStorage.getItem('token')).to.equal('fake-jwt-token-from-register');
        });
    });

    // ── Registro fallido (validaciones de frontend) ───────────────────────────────

    it('debería mostrar error si las contraseñas no coinciden', () => {
        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[placeholder="Contraseña"]').type('contraseña1');
        cy.get('input[placeholder="Confirmar Contraseña"]').type('contraseña2');
        cy.get('button[type="submit"]').click();

        cy.contains('Las contraseñas no son iguales, por favor, vuelva a ingresarlas.').should('be.visible');
    });

    // ── Validación de longitud máxima (>256 caracteres) ───────────────────────

    it('debería mostrar error si el email supera los 256 caracteres', () => {
        const emailLargo = 'a'.repeat(250) + '@test.com'; // > 256 chars
        cy.get('input[type="email"]').invoke('val', emailLargo).trigger('input');
        cy.get('input[type="email"]').clear().type(emailLargo, { delay: 0 });
        cy.get('input[placeholder="Contraseña"]').type('MiContraseña123');
        cy.get('input[placeholder="Confirmar Contraseña"]').type('MiContraseña123');
        cy.get('button[type="submit"]').click();
        cy.contains('El email y la contraseña no pueden superar los 256 caracteres.').should('be.visible');
    });

    it('debería mostrar error si la contraseña supera los 256 caracteres', () => {
        const passwordLarga = 'p'.repeat(257);
        cy.get('input[type="email"]').type('usuario@ejemplo.com');
        cy.get('input[placeholder="Contraseña"]').type(passwordLarga, { delay: 0 });
        cy.get('input[placeholder="Confirmar Contraseña"]').type(passwordLarga, { delay: 0 });
        cy.get('button[type="submit"]').click();
        cy.contains('El email y la contraseña no pueden superar los 256 caracteres.').should('be.visible');
    });

    // ── Registro fallido (errores del backend) ───────────────────────────────

    it('debería mostrar el error devuelto por el servidor (ej: email ya en uso)', () => {
        cy.intercept('POST', '**/auth/register', {
            statusCode: 400,
            body: { message: 'El correo electrónico ya está registrado.' },
        }).as('registerFail');

        cy.get('input[type="email"]').type('usuario_existente@ejemplo.com');
        cy.get('input[placeholder="Contraseña"]').type('contraseña123');
        cy.get('input[placeholder="Confirmar Contraseña"]').type('contraseña123');
        cy.get('button[type="submit"]').click();

        cy.wait('@registerFail');
        cy.contains('El correo electrónico ya está registrado.').should('be.visible');
    });

});
