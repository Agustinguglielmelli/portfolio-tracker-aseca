import type { Options } from '@wdio/types';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(__dirname, '..', '..', 'back', '.env.test'), override: true });

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
      'appium:noReset': false,  // limpia estado entre suites
      'appium:newCommandTimeout': 240,
    },
  ],

  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
};
