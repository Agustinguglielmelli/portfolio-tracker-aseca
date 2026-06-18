import type { AppiumBrowser } from '../support/app';

export class AuthScreen {
  constructor(private app: AppiumBrowser) {}

  async login(email: string, password: string): Promise<void> {
    await this.app.type('email-input', email);
    await this.app.type('password-input', password);
    await this.app.tap('login-submit');
    await this.app.el('trade-button', 50_000);
    await this.app.pause(1500);
  }
}
