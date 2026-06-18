import { AppiumBrowser } from "../support/app";
import { setupTestUser } from "../support/test-data";
import { AuthScreen } from "../screens/auth.screen";
import { CompanyScreen } from "../screens/company.screen";
const EMAIL = `e2e_company_mobile_${Date.now()}@test.com`;
const PASSWORD = "Password123!";
const app = new AppiumBrowser();
const auth = new AuthScreen(app);
const company = new CompanyScreen(app);
describe("Company", () => {
  before(async () => {
    await setupTestUser(EMAIL, PASSWORD, { AAPL: 150 });
  });
  beforeEach(async () => {
    await app.restart();
    await auth.login(EMAIL, PASSWORD);
    const searchTab = await app.el("company-tab"); // Assuming there's a way to get to companies?
    await searchTab.click();
  });
  after(async () => {
    await app.restart();
    await auth.logout();
  });
  it("searches for a company, navigates to its detail and renders data", async () => {
    await company.search("Apple");
    await company.selectOption("AAPL");
    const title = await company.getTitle();
    expect(title).toContain("AAPL");
    await company.waitForMetrics();
    await company.waitForFilings();
  });
  it("searches for a non-existent company and shows not found message", async () => {
    await company.search("NONEXISTENTCOMPANY123");
    await app.pause(3000);
    const option = await $("~ticker-option-NONEXISTENTCOMPANY123");
    expect(await option.isExisting()).toBe(false);
  });
});
