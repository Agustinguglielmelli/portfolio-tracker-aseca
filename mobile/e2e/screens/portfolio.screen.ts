import type { AppiumBrowser } from '../support/app';
import type { AuthScreen } from './auth.screen';

export class PortfolioScreen {
  constructor(
    private app: AppiumBrowser,
    private auth: AuthScreen,
  ) {}

  async open(email: string, password: string): Promise<void> {
    await this.app.restart();
    await this.auth.login(email, password);
  }

  async buy(ticker: string, quantity: number): Promise<void> {
    await this.openModal('buy', ticker, quantity);
  }

  async sell(ticker: string, quantity: number): Promise<void> {
    await this.openModal('sell', ticker, quantity);
  }

  private async openModal(
    type: 'buy' | 'sell',
    ticker: string,
    quantity: number,
  ): Promise<void> {
    await this.app.tap('trade-button');
    await this.app.pause(3000);

    const toggle = await this.app.elExists(`trade-type-${type}`, 8_000);
    await toggle.click();

    await this.app.typeInModal('ticker-search', ticker);

    const option = await $(`~ticker-option-${ticker}`);
    await option.waitForExist({ timeout: 8_000 });
    await option.click();

    await this.app.typeInModal('quantity-input', String(quantity));

    await this.app.tap('modal-title');
    await this.app.pause(1000);

    const submit = await this.app.elExists('trade-submit', 5_000);
    await submit.click();
  }

  async waitForPosition(ticker: string, timeout = 12_000): Promise<void> {
    await this.app.el(`position-row-${ticker}`, timeout);
  }

  async waitForEmptyState(timeout = 12_000): Promise<void> {
    await this.app.el('portfolio-empty', timeout);
  }

  async positionSharesText(ticker: string): Promise<string> {
    return this.app.getText(`position-shares-${ticker}`);
  }

  async tradeErrorText(): Promise<string> {
    return this.app.getText('trade-error', 8_000);
  }

  async openHistory(): Promise<void> {
    await this.app.tap('history-toggle');
    await this.app.scroll('down');
  }

  async firstTransactionTicker(): Promise<string> {
    return this.app.getText('transaction-ticker', 8_000);
  }
}
