export {};

const PASSWORD = 'Password123!';
const API = 'http://localhost:3000';

const generateEmail = (prefix: string) => `${prefix}_${Date.now()}@test.com`;

describe('Auth - Registro', () => {
    let currentEmail = '';

    beforeEach(() => {
        currentEmail = generateEmail('reg');
        cy.clearLocalStorage();
        cy.visit('/register');
    });

    it('muestra el formulario de registro correctamente', () => {
        cy.get('h1').should('contain', 'Crear cuenta');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('have.length', 2);
        cy.get('button[type="submit"]').should('contain', 'Crear cuenta');
    });

    it('tiene un link para ir al login', () => {
        cy.get('a[href="/login"]').should('be.visible').click();
        cy.url().should('include', '/login');
    });

    it('registro exitoso redirige al dashboard', () => {
        cy.get('input[type="email"]').type(currentEmail);
        cy.get('input[type="password"]').first().type(PASSWORD);
        cy.get('input[type="password"]').last().type(PASSWORD);
        cy.get('button[type="submit"]').click();

        cy.url({ timeout: 8000 }).should('include', '/dashboard');
    });

    it('muestra error si las contraseñas no coinciden', () => {
        cy.get('input[type="email"]').type(currentEmail);
        cy.get('input[type="password"]').first().type(PASSWORD);
        cy.get('input[type="password"]').last().type('OtraPassword123!');
        cy.get('button[type="submit"]').click();

        cy.contains('Las contraseñas no son iguales').should('be.visible');
        cy.url().should('include', '/register');
    });

    it('muestra error si el email ya está registrado', () => {
        cy.request('POST', `${API}/auth/register`, {
            email: currentEmail,
            password: PASSWORD,
            confirmPassword: PASSWORD,
        });

        cy.get('input[type="email"]').type(currentEmail);
        cy.get('input[type="password"]').first().type(PASSWORD);
        cy.get('input[type="password"]').last().type(PASSWORD);
        cy.get('button[type="submit"]').click();

        cy.contains('El mail ya está registrado', { timeout: 6000 }).should('be.visible');
        cy.url().should('include', '/register');
    });

    it('muestra error de validación de longitud máxima en el cliente', () => {
        const longString = 'a'.repeat(257);

        cy.get('input[type="email"]').type(`${longString}@test.com`);
        cy.get('input[type="password"]').first().type(longString);
        cy.get('input[type="password"]').last().type(longString);
        cy.get('button[type="submit"]').click();

        cy.contains('no pueden superar los 256 caracteres').should('be.visible');
        cy.url().should('include', '/register');
    });

    it('usuario ya logueado es redirigido fuera del registro', () => {
        cy.request('POST', `${API}/auth/register`, {
            email: currentEmail,
            password: PASSWORD,
            confirmPassword: PASSWORD,
        });
        cy.loginByApi(currentEmail, PASSWORD);
        cy.visit('/register');

        cy.url({ timeout: 6000 }).should('not.include', '/register');
    });
});

describe('Auth - Login', () => {
    let loginEmail = '';

    before(() => {
        loginEmail = generateEmail('login');
        cy.request('POST', `${API}/auth/register`, {
            email: loginEmail,
            password: PASSWORD,
            confirmPassword: PASSWORD,
        });
    });

    beforeEach(() => {
        cy.clearLocalStorage();
        cy.visit('/login');
    });

    it('muestra el formulario de login correctamente', () => {
        cy.get('h1').should('contain', 'Iniciar sesión');
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('contain', 'Ingresar');
    });

    it('tiene un link para ir al registro', () => {
        cy.get('a[href="/register"]').should('be.visible').click();
        cy.url().should('include', '/register');
    });

    it('login exitoso redirige al dashboard y guarda el token', () => {
        cy.get('input[type="email"]').type(loginEmail);
        cy.get('input[type="password"]').type(PASSWORD);
        cy.get('button[type="submit"]').click();

        cy.url({ timeout: 8000 }).should('include', '/dashboard');
        cy.window().its('localStorage').invoke('getItem', 'token').should('not.be.null');
    });

    it('muestra error con contraseña incorrecta', () => {
        cy.get('input[type="email"]').type(loginEmail);
        cy.get('input[type="password"]').type('WrongPassword123!');
        cy.get('button[type="submit"]').click();

        cy.contains('Credenciales inválidas', { timeout: 6000 }).should('be.visible');
        cy.url().should('include', '/login');
    });

    it('muestra error con email no registrado', () => {
        cy.get('input[type="email"]').type(generateEmail('noexiste'));
        cy.get('input[type="password"]').type(PASSWORD);
        cy.get('button[type="submit"]').click();

        cy.contains('Credenciales inválidas', { timeout: 6000 }).should('be.visible');
        cy.url().should('include', '/login');
    });

    it('muestra error de validación de longitud máxima en el cliente', () => {
        const longString = 'a'.repeat(257);

        cy.get('input[type="email"]').type(`${longString}@test.com`);
        cy.get('input[type="password"]').type(longString);
        cy.get('button[type="submit"]').click();

        cy.contains('no pueden superar los 256 caracteres').should('be.visible');
        cy.url().should('include', '/login');
    });

    it('usuario ya logueado es redirigido fuera del login', () => {
        cy.loginByApi(loginEmail, PASSWORD);
        cy.visit('/login');

        cy.url({ timeout: 6000 }).should('not.include', '/login');
    });

    it('sin token no se puede acceder al dashboard', () => {
        cy.visit('/dashboard');
        cy.url().should('include', '/login');
    });
});
