// @ts-check
import 'dotenv/config';
const { defineConfig, devices } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const {readJsonFile } = require('./src/utils/jsonhelper.ts');

//Test changes

const ENV = process.env.ENV || 'LIVE';
const envConfig = readJsonFile(path.join(__dirname, 'config.json'))[ENV];
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000 *3,
  actionTimeout: 60000,
  navigationTimeout: 60000,
  expect: {
    timeout: 60000
  },
  
  fullyParallel: false, /* Run tests in files in parallel */
  forbidOnly: !!process.env.CI, /* Fail the build on CI if you accidentally left test.only in the source code. */
  retries: process.env.CI ? 2 : 0, /* Retry on CI only */
  workers: process.env.CI ? 1 : 5, /* Opt out of parallel tests on CI. */
  reporter: [['list', { printSteps: true }],['html']], /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: envConfig.baseURL,
    credentials: {
      username: envConfig.credentials.username, 
      password: envConfig.credentials.password
    },
    trace: 'on',
    headless: true,
    screenshot: 'on',
    
  },

  projects: [
    /**
     * Setup Project - Generates authentication state for storageState tests
     * 
     * Runs auth.setup.ts to perform Google login and save cookies/localStorage.
     * Usage: npm run Generate:auth (local) | Not run in CI (uses pre-generated state)
     */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      
    },
    /**
     * Chrome Project - Primary browser for YouTube with anti-bot detection
     * 
     * Launch args remove automation indicators to reduce CAPTCHA likelihood:
     * --disable-blink-features=AutomationControlled (removes navigator.webdriver)
     * --disable-automation (removes automation features)
     * --no-sandbox, --disable-setuid-sandbox (required for Docker/CI)
     * --disable-dev-shm-usage (prevents /dev/shm issues in containers)
     * --disable-gpu, --no-first-run, --no-zygote (stability and performance)
     * 
     * Note: Even with these, GitHub-hosted runners may get CAPTCHAs (datacenter IPs).
     */
    {

      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'], 
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-automation',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      },
      
    },

  ],
});

