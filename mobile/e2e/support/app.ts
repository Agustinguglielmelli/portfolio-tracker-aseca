const BUNDLE = 'com.anonymous.portfolio-tracker';

export class AppiumBrowser {
  async el(testId: string, timeout = 10_000): Promise<WebdriverIO.Element> {
    const elem = await $(`~${testId}`);
    await elem.waitForDisplayed({ timeout });
    return elem;
  }

  async elExists(testId: string, timeout = 10_000): Promise<WebdriverIO.Element> {
    const elem = await $(`~${testId}`);
    await elem.waitForExist({ timeout });
    return elem;
  }

  async tap(testId: string, timeout = 10_000): Promise<void> {
    const elem = await this.elExists(testId, timeout);
    const size = await elem.getSize();
    const x = Math.round(size.width / 2);
    const y = Math.round(size.height / 2);
    await driver.execute('mobile: tap', { element: elem.elementId, x, y });
  }

  async type(testId: string, text: string, timeout = 10_000): Promise<void> {
    const elem = await this.el(testId, timeout);
    await elem.setValue(text);
  }

  async typeInModal(testId: string, text: string, timeout = 10_000): Promise<void> {
    const elem = await this.elExists(testId, timeout);
    await elem.setValue(text);
  }

  async getText(testId: string, timeout = 10_000): Promise<string> {
    const elem = await this.el(testId, timeout);
    return elem.getText();
  }

  async scroll(direction: 'up' | 'down' = 'down'): Promise<void> {
    await driver.execute('mobile: scroll', { direction });
    await driver.pause(400);
  }

  async restart(): Promise<void> {
    await driver.terminateApp(BUNDLE);
    await driver.activateApp(BUNDLE);
  }

  async pause(ms: number): Promise<void> {
    await driver.pause(ms);
  }
}
