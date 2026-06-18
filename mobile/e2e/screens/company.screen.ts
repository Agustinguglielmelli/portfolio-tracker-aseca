import { AppiumBrowser } from '../support/app';

export class CompanyScreen {
  constructor(private app: AppiumBrowser) {}

  async search(query: string) {
    await this.app.type('ticker-search', query);
  }

  async selectOption(ticker: string) {
    const el = await this.app.el(`ticker-option-${ticker}`);
    await el.click();
  }

  async getTitle() {
    return this.app.getText('company-title');
  }

  async waitForMetrics() {
    await this.app.el('metrics-section');
  }

  async waitForFilings() {
    await this.app.el('filings-section');
  }
}
