/**
 * Authentication Setup - Generates StorageState for Pre-Authenticated Tests
 * 
 * Performs Google login once and saves browser cookies/localStorage to a file.
 * Other tests can load this file to start pre-authenticated, bypassing UI login.
 * 
 * StorageState Contains:
 * - Session cookies (SID, SSID, HSID from Google)
 * - localStorage data (user preferences, cached tokens)
 * 
 * Usage:
 * - Local: npm run Generate:auth
 * - CI: Decoded from GitHub Secret YOUTUBE_AUTH_STATE
 * - Tests: Loaded via test.use({ storageState: '...' }) in 002_youtube_e2e_storagestate.spec.ts
 * 
 * Regenerate When:
 * - Session expires (~30-60 days)
 * - Credentials change
 * - Tests fail with authentication errors
 */

import { test as setup, expect } from '@playwright/test';
import YouTubePage from '../../src/pages/YouTubePage';
import GoogleLoginPage from '../../src/pages/GoogleLoginPage';
import { TestOptions } from '../../src/types/index';
import * as path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate with Google', async ({ page }) => {
  console.log('Starting authentication setup...');
  
  const youtubePage = new YouTubePage(page);
  await youtubePage.navigate();
  await youtubePage.acceptCookies();
  console.log('✓ Navigated to YouTube and accepted cookies');
  
  console.log('Initiating Google sign-in...');
  await youtubePage.clickSignIn();
  
  const googleLoginPage = new GoogleLoginPage(page);
  const credentials = (setup.info().project.use as TestOptions).credentials;
  await googleLoginPage.performLogin(credentials.username, credentials.password);
  
  await page.waitForURL(setup.info().project.use.baseURL!, { timeout: 30000 });
  const isSignedIn = await youtubePage.isSignedIn();
  expect(isSignedIn).toBeTruthy();
  console.log('✓ Successfully authenticated with Google');
  
  await page.context().storageState({ path: authFile });
  console.log(`✓ Authentication state saved to ${authFile}`);
});
