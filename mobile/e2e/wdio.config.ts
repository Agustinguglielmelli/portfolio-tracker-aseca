import type { Options } from '@wdio/types';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '..', '..', 'back', '.env.test'), override: true });
process.env.DATABASE_URL = 'postgres://postgres:password@localhost:5435/integration_test_db';

function findAppPath(): string {
  const derivedData = path.join(process.env.HOME!, 'Library/Developer/Xcode/DerivedData');
  try {
    const result = execSync(
      `find "${derivedData}" -name "PortfolioTracker.app" -path "*/Debug-iphonesimulator/*" 2>/dev/null | head -1`,
      { encoding: 'utf8' }
    ).trim();
    if (result) return result;
  } catch {}

  throw new Error(
    '\n\n No se encontró PortfolioTracker.app en DerivedData.\n' +
    '   Compilá la app primero con:\n\n' +
    '   cd mobile && npx expo run:ios\n\n'
  );
}

export const config: any = {
  runner: 'local',
  port: 4723,

  specs: ['./specs/**/*.spec.ts'],

  maxInstances: 1,

  capabilities: [
    {
      platformName: 'iOS',
      'appium:automationName': 'XCUITest',
      'appium:deviceName': 'iPhone 17 Pro',
      'appium:platformVersion': '26.5',
      'appium:app': findAppPath(),
      'appium:bundleId': 'com.anonymous.portfolio-tracker',
      'appium:noReset': false,
      'appium:newCommandTimeout': 240,
    },
  ],

  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: ['appium'],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },

  onPrepare: function () {
    try {
      execSync('docker compose -f ../docker-compose.mobile.e2e.yml up -d --build --wait', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to start docker compose', error);
      throw error;
    }
  },

  onComplete: function () {
    try {
      execSync('docker compose -f ../docker-compose.mobile.e2e.yml down -v', { stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to stop docker compose', error);
    }
  },
};
