/**
 * YouTube E2E Test - UI-Based Authentication
 * 
 * This test performs full Google OAuth login via UI (Step 1) before executing YouTube automation.
 * "Approach 1" in our dual authentication strategy.
 * 
 * When to Use:
 * - Local testing and development
 * - Self-hosted CI runners (trusted IPs avoid Google CAPTCHA)
 * - Testing the actual login flow
 * 
 * Limitations:
 * - Fails on GitHub-hosted runners (Google blocks datacenter IPs with CAPTCHA)
 * - Slower (~14s longer due to login)
 * 
 * CI Setup: Runs on self-hosted runner (see .github/workflows/playwright-tests.yml)
 * Alternative: 002_youtube_e2e_storagestate.spec.ts (pre-authenticated, works everywhere)
 */

import { test, expect } from '@playwright/test';
import YouTubePage from '../../src/pages/YouTubePage';
import GoogleLoginPage from '../../src/pages/GoogleLoginPage';
import videoHelper from '../../src/utils/videoHelper';
import screenshotUtils from '../../src/utils/ScreenshotUtils';
import { readJsonFile } from '../../src/utils/jsonhelper';
import { TestOptions } from '../../src/types/index';
import * as path from 'path';

const testData = readJsonFile(path.join(__dirname, '../../src/data/UI/001_youtube_e2e_UI.json'));

test.describe('YouTube E2E Test Suite', {
  tag: ['@youtube', '@smoke','@e2e'],
}, () => {

  let youtubePage: YouTubePage;
   let googleLoginPage: GoogleLoginPage;
 let credentials: { username: string; password: string };
 
  test.beforeEach('Navigate to YouTube', async ({ page }) => {
    youtubePage = new YouTubePage(page);
    await youtubePage.navigate();
    await youtubePage.acceptCookies();
    console.log('✓ Navigated to YouTube and accepted cookies');
  });

  test('YouTube E2E: Search, Play/Pause, Seek, Screenshot, and Title Verification', async ({ page }) => {

    await test.step('Step 1: Google Sign-In', async () => {
      // Perform Google OAuth login: Click Sign In → Enter email → Enter password → Verify avatar
      // Works on self-hosted runners but triggers CAPTCHA on GitHub-hosted runners
      console.log('Starting Google sign-in process...');
      await youtubePage.clickSignIn();
      googleLoginPage = new GoogleLoginPage(page);
      credentials = (test.info().project.use as TestOptions).credentials;
      await googleLoginPage.performLogin(credentials.username, credentials.password);
      await page.waitForURL(test.info().project.use.baseURL!, { timeout: 25000 });
      const isSignedIn = await youtubePage.isSignedIn();
      expect(isSignedIn).toBeTruthy();
      console.log('✓ Successfully signed in to YouTube with Google account');
    });

    await test.step('Step 2: Search for keyword and verify results', async () => {
      console.log(`Searching for: "${testData.searchKeyword}"`);
      await youtubePage.searchFor(testData.searchKeyword);
      
      const resultsCount = await youtubePage.getResultsCount();
      console.log(`✓ Found ${resultsCount} search results`);
      
      expect(resultsCount).toBeGreaterThan(0);
      console.log('✓ Verified at least one result is returned');
    });

    await test.step('Step 3: Click first video and verify it starts playing', async () => {
      console.log('Clicking on the first video result');
      await youtubePage.clickFirstVideo();
      console.log('✓ Video page loaded');

      await youtubePage.skipAds();
      
      const isNowPlaying = await videoHelper.isVideoPlaying(youtubePage.videoPlayer);
      expect(isNowPlaying).toBeTruthy();
      console.log('✓ Verified video is playing');
    }, { timeout: 60000 *2 });

    await test.step('Step 4: Pause the video and verify it has stopped', async () => {
      console.log('Pausing the video');
      await videoHelper.pauseVideo(youtubePage.videoPlayer);
      await page.waitForTimeout(2000);
      
      const isPaused = !(await videoHelper.isVideoPlaying(youtubePage.videoPlayer));
      expect(isPaused).toBeTruthy();
      console.log('✓ Verified video is paused');
    });

    await test.step('Step 5: Seek/Skip to a later point and verify time advanced', async () => {
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

    await test.step('Step 6: Resume playing and take screenshot', async () => {
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

    await test.step('Step 7: Verify video title is not empty', async () => {
      const videoTitle = await youtubePage.getVideoTitle();
      console.log(`Video Title: "${videoTitle}"`);
      
      expect(videoTitle).not.toBe('');
      expect(videoTitle.length).toBeGreaterThan(0);
      console.log('✓ Verified video title is not empty');
    });

    console.log('\n✓ All YouTube E2E test steps completed successfully!');
  });
});
