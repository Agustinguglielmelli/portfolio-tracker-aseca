import { AppiumBrowser } from '../support/app';
import { setupTestUser, resetTransactions, buyViaApi } from '../support/test-data';
import { AuthScreen } from '../screens/auth.screen';
import { PortfolioScreen } from '../screens/portfolio.screen';

const EMAIL    = 'e2e_portfolio_mobile@test.com';
const PASSWORD = 'Password123!';

const app       = new AppiumBrowser();
const auth      = new AuthScreen(app);
const portfolio = new PortfolioScreen(app, auth);

describe('Portfolio', () => {

  before(async () => {
    await setupTestUser(EMAIL, PASSWORD, { AAPL: 150 });
  });

  beforeEach(async () => {
    await resetTransactions(EMAIL);
    await portfolio.open(EMAIL, PASSWORD);
  });

  it('shows empty state when there are no positions', async () => {
    await portfolio.waitForEmptyState();
  });

  it('registers a buy from UI and shows position', async () => {
    await portfolio.buy('AAPL', 10);

    await portfolio.waitForPosition('AAPL');
    const shares = await portfolio.positionSharesText('AAPL');
    expect(shares).toContain('10');
  });

  it('registers a sell and updates position', async () => {
    await buyViaApi(EMAIL, PASSWORD, 'AAPL', 10);
    await portfolio.open(EMAIL, PASSWORD);

    await portfolio.waitForPosition('AAPL');
    await portfolio.sell('AAPL', 5);

    const shares = await portfolio.positionSharesText('AAPL');
    expect(shares).toContain('5');
  });

  it('selling everything closes the position', async () => {
    await buyViaApi(EMAIL, PASSWORD, 'AAPL', 10);
    await portfolio.open(EMAIL, PASSWORD);

    await portfolio.waitForPosition('AAPL');
    await portfolio.sell('AAPL', 10);

    await portfolio.waitForEmptyState();
  });

  it('shows error when trying to sell more than available', async () => {
    await buyViaApi(EMAIL, PASSWORD, 'AAPL', 5);
    await portfolio.open(EMAIL, PASSWORD);

    await portfolio.waitForPosition('AAPL');
    await portfolio.sell('AAPL', 20);

    const error = await portfolio.tradeErrorText();
    expect(error).toBeTruthy();
  });

  it('shows transaction history', async () => {
    await buyViaApi(EMAIL, PASSWORD, 'AAPL', 10);
    await portfolio.open(EMAIL, PASSWORD);

    await portfolio.waitForPosition('AAPL');
    await portfolio.openHistory();

    const ticker = await portfolio.firstTransactionTicker();
    expect(ticker).toBe('AAPL');
  });
});
