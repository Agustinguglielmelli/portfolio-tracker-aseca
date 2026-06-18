import type { AppiumBrowser } from "../support/app";
export class AuthScreen {
  constructor(private app: AppiumBrowser) {}
  async login(email: string, password: string): Promise<void> {
    const tradeBtn = await $(`~trade-button`);
    const emailInput = await $(`~email-input`);
    await driver.waitUntil(
      async () =>
        (await emailInput.isExisting()) || (await tradeBtn.isExisting()),
      { timeout: 20000, timeoutMsg: "App neither loaded login or dashboard" },
    );
    if (await tradeBtn.isExisting()) {
      await this.app.pause(1500);
      return;
    }
    await this.app.type("email-input", email);
    await this.app.type("password-input", password);
    if (driver.isIOS) {
      try { await driver.hideKeyboard(); } catch (e) {}
    }
    await this.app.tap("login-submit");
    
    await this.app.el("trade-button", 50_000);
    await this.app.pause(1500);
  }
  async logout(): Promise<void> {
    try {
      const logoutBtn = await this.app.el("logout-button", 5000);
      await logoutBtn.click();

      try {
        await driver.acceptAlert();
      } catch (e) {
        const confirmBtn = await $(`~Salir`);
        if (await confirmBtn.isExisting()) {
          await confirmBtn.click();
        }
      }

      const emailInput = await this.app.el("email-input", 10000);
      await emailInput.waitForDisplayed();
    } catch (e) {
    }
  }
  async goToRegister(): Promise<void> {
    const link = await this.app.el("register-link");
    await link.click();
  }
  async getErrorMessage(): Promise<string> {
    return await this.app.getText("auth-error");
  }
}
