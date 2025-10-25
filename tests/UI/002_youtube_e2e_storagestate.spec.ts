/**
 * YouTube E2E Test - StorageState Authentication (Pre-Authenticated)
 * 
 * Uses saved authentication state (cookies/localStorage) to start pre-authenticated.
 * No UI login required. "Approach 2" in our dual authentication strategy.
 * 
 * How It Works:
 * 1. auth.setup.ts performs Google login once and saves browser state
 * 2. Saved file contains session cookies (SID, SSID, HSID)
 * 3. This test loads state via test.use({ storageState: '...' })
 * 4. Browser starts with cookies already set → YouTube sees authenticated session
 * 
 * Advantages:
 * - Works on ALL runners (GitHub-hosted, self-hosted, local)
 * - Bypasses Google CAPTCHA/bot detection
 * - Faster (~14s faster - no login UI)
 * - Recommended for CI/CD
 * 
 * Limitations:
 * - Auth expires after 30-60 days (regenerate with: npm run Generate:auth)
 * - Doesn't test the login flow itself
 * 
 * CI Setup: Runs on GitHub-hosted ubuntu-latest (see .github/workflows/playwright-tests.yml)
 * Alternative: 001_youtube_e2e_UI.spec.ts (tests actual login flow)
 */

import { test, expect } from '@playwright/test';
import YouTubePage from '../../src/pages/YouTubePage';
import videoHelper from '../../src/utils/videoHelper';
import screenshotUtils from '../../src/utils/ScreenshotUtils';
import { readJsonFile } from '../../src/utils/jsonhelper';
import * as path from 'path';

const testData = readJsonFile(path.join(__dirname, '../../src/data/UI/002_youtube_e2e_storagestate.json'));

test.describe('YouTube E2E Test Suite (StorageState Auth)', {
  tag: ['@youtube', '@smoke', '@e2e', '@storagestate'],
}, () => {

  /**
   * Load pre-authenticated state from file
   * 
   * File contains cookies and localStorage. Playwright injects them into browser
   * before test starts, so YouTube recognizes the session as authenticated.
   */
  test.use({
    storageState: path.join(__dirname, '../../playwright/.auth/user.json'),
  });

  let youtubePage: YouTubePage;

  test.beforeEach('Navigate to YouTube', async ({ page }) => {
    // Verify storageState authentication worked by checking for avatar
    // If avatar not found: auth state missing, expired, or corrupted
    youtubePage = new YouTubePage(page);
    await youtubePage.navigate();
    await youtubePage.acceptCookies();
    
    const isSignedIn = await youtubePage.isSignedIn();
    expect(isSignedIn).toBeTruthy();
    console.log('✓ Navigated to YouTube (already authenticated via storageState)');
  });

  test('YouTube E2E: Search, Play/Pause, Seek, Screenshot, and Title Verification', async ({ page }) => {

    await test.step('Step 1: Search for keyword and verify results', async () => {
      console.log(`Searching for: "${testData.searchKeyword}"`);
      await youtubePage.searchFor(testData.searchKeyword);
      
      const resultCount = await youtubePage.getResultsCount();
      console.log(`Found ${resultCount} results`);
      
      expect(resultCount).toBeGreaterThan(0);
      console.log('✓ Verified at least one result is returned');
    });

    await test.step('Step 2: Click first video and verify it starts playing', async () => {
      console.log('Clicking on the first video result');
      await youtubePage.clickFirstVideo();
      console.log('✓ Video page loaded');
      
      await page.waitForTimeout(3000);
      
      const isPlaying = await videoHelper.isVideoPlaying(youtubePage.videoPlayer);
      expect(isPlaying).toBe(true);
      console.log('✓ Verified video is playing');
    }, { timeout: 60000 *2 });

    await test.step('Step 3: Pause the video and verify it has stopped', async () => {
      console.log('Pausing the video');
      await videoHelper.pauseVideo(youtubePage.videoPlayer);
      await page.waitForTimeout(2000);
      
      const isPlaying = await videoHelper.isVideoPlaying(youtubePage.videoPlayer);
      expect(isPlaying).toBe(false);
      console.log('✓ Verified video is paused');
    });

    await test.step('Step 4: Seek/Skip to a later point and verify time advanced', async () => {
      const videoElement = youtubePage.videoPlayer;
      
      const timeBefore = await videoHelper.getCurrentTime(videoElement);
      console.log(`Current video time before seek: ${timeBefore.toFixed(2)} seconds`);
      
      const skipAmount = testData.seekTimeInSeconds;
      console.log(`Seeking forward by ${skipAmount} seconds`);
      await videoHelper.skipForward(videoElement, skipAmount);
      
      const timeAfter = await videoHelper.getCurrentTime(videoElement);
      console.log(`Current video time after seek: ${timeAfter.toFixed(2)} seconds`);
      
      expect(timeAfter).toBeGreaterThan(timeBefore);
      expect(timeAfter - timeBefore).toBeGreaterThanOrEqual(skipAmount - 2);
      console.log('✓ Verified video time has advanced');
    });

    await test.step('Step 5: Resume playing and take screenshot', async () => {
      const videoElement = youtubePage.videoPlayer;
      
      console.log('Resuming video playback');
      await videoHelper.playVideo(videoElement);
      await page.waitForTimeout(2000);
      
      const isPlaying = await videoHelper.isVideoPlaying(videoElement);
      expect(isPlaying).toBeTruthy();
      console.log('✓ Video is playing');
      
      console.log('Taking screenshot while video is playing');
      const screenshotFilename = screenshotUtils.generateScreenshotFilename();
      const screenshotPath = await screenshotUtils.takeScreenshot(page, screenshotFilename);
      console.log(`✓ Screenshot saved to: ${screenshotPath}`);
      
      const screenshotExists = screenshotUtils.screenshotExists(screenshotFilename);
      expect(screenshotExists).toBeTruthy();
      console.log('✓ Verified screenshot file exists');
    });

    await test.step('Step 6: Verify video title is not empty', async () => {
      const videoTitle = await youtubePage.getVideoTitle();
      console.log(`Video Title: "${videoTitle}"`);
      
      expect(videoTitle).not.toBe('');
      expect(videoTitle.length).toBeGreaterThan(0);
      console.log('✓ Verified video title is not empty');
    });
  });
});
