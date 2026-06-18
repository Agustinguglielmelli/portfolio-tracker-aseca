import { $ } from '@wdio/globals';
import { AppiumBrowser } from '../support/app';

export class WatchlistScreen {
  constructor(private app: AppiumBrowser) {}

  async search(query: string) {
    await this.app.type("ticker-search", query);
  }

  async selectOption(ticker: string) {
    await this.app.tap(`ticker-option-${ticker}`);
  }

  async waitForWatchlistItem(ticker: string) {
    await this.app.el(`watchlist-item-${ticker}`);
  }

  async checkWatchlistItemNotExists(ticker: string) {
    const el = await $(`~watchlist-item-${ticker}`);
    await el.waitForExist({ reverse: true, timeout: 5000 });
  }

  async removeWatchlistItem(ticker: string) {
    await this.app.tap(`remove-watchlist-${ticker}`);

    // Wait for the native alert and accept it
    await driver.waitUntil(
      async () => {
        try {
          await driver.getAlertText();
          return true;
        } catch {
          return false;
        }
      },
      { timeout: 5000 },
    );
    await driver.acceptAlert();
  }

  async compare() {
    await this.app.tap("watchlist-comparison");
  }

  async selectWatchlistItem(ticker: string) {
    await this.app.tap(`watchlist-item-checkbox-${ticker}`);
  }
}
