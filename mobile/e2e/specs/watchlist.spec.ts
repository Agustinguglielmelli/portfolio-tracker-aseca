import { AppiumBrowser } from "../support/app";
import { setupTestUser, resetWatchlist } from "../support/test-data";
import { AuthScreen } from "../screens/auth.screen";
import { WatchlistScreen } from "../screens/watchlist.screen";
const EMAIL = `e2e_watchlist_mobile_${Date.now()}@test.com`;
const PASSWORD = "Password123!";
const app = new AppiumBrowser();
const auth = new AuthScreen(app);
const watchlist = new WatchlistScreen(app);
describe("Watchlist", () => {
  before(async () => {
    await setupTestUser(EMAIL, PASSWORD, { AAPL: 150, MSFT: 300 });
  });
  beforeEach(async () => {
    await resetWatchlist(EMAIL);
    await app.restart();
    await auth.login(EMAIL, PASSWORD);

    const watchlistTab = await app.el("watchlist-tab");
    await watchlistTab.click();
  });
  after(async () => {
    await app.restart();
    await auth.logout();
  });
  it("adds companies to the watchlist", async () => {
    await watchlist.search("Apple");
    await watchlist.selectOption("AAPL");
    await watchlist.waitForWatchlistItem("AAPL");
    await watchlist.search("Microsoft");
    await watchlist.selectOption("MSFT");
    await watchlist.waitForWatchlistItem("MSFT");
  });
  it.only("compares companies in the watchlist", async () => {
    await watchlist.search("Apple");
    await watchlist.selectOption("AAPL");
    await watchlist.waitForWatchlistItem("AAPL");

    await watchlist.search("Microsoft");
    await watchlist.selectOption("MSFT");
    await watchlist.waitForWatchlistItem("MSFT");

    await watchlist.selectWatchlistItem("AAPL");
    await watchlist.selectWatchlistItem("MSFT");
    await watchlist.compare();

    const comparisonScreen = await app.el("comparison-screen");
    await expect(comparisonScreen).toBeDisplayed();

    const aaplColumn = await app.el("comparison-col-AAPL");
    await expect(aaplColumn).toBeDisplayed();

    const msftColumn = await app.el("comparison-col-MSFT");
    await expect(msftColumn).toBeDisplayed();
  });
  it("removes a company from the watchlist", async () => {
    await watchlist.search("Apple");
    await watchlist.selectOption("AAPL");
    await watchlist.waitForWatchlistItem("AAPL");
    await watchlist.removeWatchlistItem("AAPL");
    await watchlist.checkWatchlistItemNotExists("AAPL");
  });
});
