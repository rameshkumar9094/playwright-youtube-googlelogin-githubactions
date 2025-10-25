import { Page, Locator } from '@playwright/test';

class YouTubePage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Returns the YouTube search input box locator
   */
  get searchBox(): Locator {
    return this.page.locator('input[name="search_query"]');
  }

  /**
   * Returns the YouTube search button locator
   */
  get searchButton(): Locator {
    return this.page.locator('button.ytSearchboxComponentSearchButton');
  }

  /**
   * Returns all video result elements from search results
   */
  get videoResults(): Locator {
    return this.page.locator('ytd-video-renderer');
  }

  /**
   * Returns the thumbnail link of the first video in search results
   */
  get firstVideoThumbnail(): Locator {
    return this.page.locator('ytd-video-renderer').first().locator('a#thumbnail');
  }

  /**
   * Returns the video title element on the video watch page
   */
  get videoTitle(): Locator {
    return this.page.locator('h1.ytd-watch-metadata yt-formatted-string');
  }

  /**
   * Returns the main YouTube video player element
   * Uses .first() to get the primary video element when multiple exist
   */
  get videoPlayer(): Locator {
    return this.page.locator('video.html5-main-video').first();
  }

  /**
   * Returns the video player play/pause button
   */
  get playPauseButton(): Locator {
    return this.page.locator('button.ytp-play-button');
  }

  /**
   * Returns the current time display element in the video player
   */
  get videoTimeDisplay(): Locator {
    return this.page.locator('.ytp-time-current');
  }

  /**
   * Returns the video progress bar element
   */
  get progressBar(): Locator {
    return this.page.locator('.ytp-progress-bar');
  }

  /**
   * Returns the cookie consent accept button (if present)
   */
  get acceptCookiesButton(): Locator {
    return this.page.locator('button[aria-label*="Accept"], button:has-text("Accept all")').first();
  }

  /**
   * Returns the ad skip button with multiple selector fallbacks
   * Handles various YouTube ad skip button formats
   */
  get skipAdButton(): Locator {
    return this.page.locator('button.ytp-ad-skip-button, button.ytp-skip-ad-button, button.ytp-ad-skip-button-modern, button:has-text("Skip Ad"), button:has-text("Skip Ads")').first();
  }

  get signInButton(): Locator {
    return this.page.locator('a[aria-label="Sign in"]').first();
  }

  get userAvatar(): Locator {
    return this.page.locator('button#avatar-btn, ytd-topbar-menu-button-renderer button[aria-label*="Google Account"]').first();
  }

  /**
   * Navigates to YouTube homepage and waits for initial page load
   */
  async navigate(): Promise<void> {
    await this.page.goto('');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Accepts cookie consent dialog if present
   * Silently continues if dialog is not found
   */
  async acceptCookies(): Promise<void> {
    try {
      if (await this.acceptCookiesButton.isVisible({ timeout: 5000 })) {
        await this.acceptCookiesButton.click();
      }
    } catch (error) {
      console.log('No cookie consent dialog found or already accepted');
    }
  }

  /**
   * Automatically detects and skips YouTube pre-roll ads
   * Handles multiple ads (up to 5) that may play in sequence
   * Waits up to 10 seconds for each skip button to appear
   */
  async skipAds(): Promise<void> {
    try {
      console.log('Checking for ads...');
      
      let adCount = 0;
      const maxAds = 5;
      
      while (adCount < maxAds) {
        try {
          const skipButton = this.skipAdButton;
          await skipButton.waitFor({ state: 'visible', timeout: 10000 });
          adCount++;
          console.log(`Ad ${adCount} detected, waiting for skip button to be clickable...`);
          
          await skipButton.click();
          console.log(`✓ Skipped ad ${adCount}`);
        } catch (error) {
          if (adCount === 0) {
            console.log('No ads detected or skip button not available');
          } else {
            console.log(`No additional ads detected after ${adCount} ad(s)`);
          }
          break;
        }
      }
      
      if (adCount >= maxAds) {
        console.log(`⚠ Reached maximum ad limit (${maxAds}), continuing with test`);
      }
      
      console.log('✓ Ad handling complete');
      
    } catch (error) {
      console.log('Ad handling completed or no ads present');
    }
  }

  /**
   * Searches for a keyword on YouTube
   * @param keyword - The search term to enter
   */
  async searchFor(keyword: string): Promise<void> {
    await this.searchBox.waitFor({ state: 'visible', timeout: 10000 });
    await this.searchBox.fill(keyword);
    await this.searchButton.click();
    await this.page.waitForLoadState('domcontentloaded',{timeout: 60000 });
  }

  /**
   * Returns the count of video results on the search page
   * @returns Number of video results found
   */
  async getResultsCount(): Promise<number> {
    await this.videoResults.first().waitFor({ state: 'visible', timeout: 20000 });
    return await this.videoResults.count();
  }

  /**
   * Clicks on the first video in search results and waits for video page to load
   */
  async clickFirstVideo(): Promise<void> {
    await this.firstVideoThumbnail.waitFor({ state: 'visible', timeout: 10000 });
    await this.firstVideoThumbnail.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.videoPlayer.waitFor({ state: 'attached', timeout: 15000 });
  }

  /**
   * Retrieves the title of the currently playing video
   * @returns The video title as a string
   */
  async getVideoTitle(): Promise<string> {
    await this.videoTitle.waitFor({ state: 'visible', timeout: 10000 });
    const title = await this.videoTitle.textContent();
    return title?.trim() || '';
  }

  /**
   * Initiates Google OAuth login from YouTube
   * 
   * Clicks "Sign in" → redirects to accounts.google.com → user enters credentials → redirects back to YouTube.
   * Used by UI tests (001) and auth.setup.ts. Not used by storageState tests (002).
   */
  async clickSignIn(): Promise<void> {
    await this.signInButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.signInButton.click();
    await this.page.waitForLoadState('networkidle');
    console.log('✓ Clicked Sign In button');
  }

  /**
   * Checks if user is signed in by detecting avatar presence
   * 
   * Avatar visible = authenticated. Used to verify both UI login and storageState authentication.
   * @returns true if authenticated, false otherwise
   */
  async isSignedIn(): Promise<boolean> {
    try {
      await this.userAvatar.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

export default YouTubePage;
