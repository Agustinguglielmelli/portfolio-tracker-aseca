import type { AppiumBrowser } from '../support/app';

export class AuthScreen {
  constructor(private app: AppiumBrowser) {}

  async login(email: string, password: string): Promise<void> {
    const tradeBtn = await $(`~trade-button`);
    const emailInput = await $(`~email-input`);

    await driver.waitUntil(
      async () => (await emailInput.isExisting()) || (await tradeBtn.isExisting()),
      { timeout: 20000, timeoutMsg: 'App neither loaded login or dashboard' }
    );

    if (await tradeBtn.isExisting()) {
      return;
    }

    await this.app.type('email-input', email);
    await this.app.type('password-input', password);
    await this.app.tap('login-submit');
    await this.app.el('trade-button', 50_000);
    await this.app.pause(1500);
  }
}
