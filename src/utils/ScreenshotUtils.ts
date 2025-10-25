import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ScreenshotUtils - Captures and manages test screenshots
 * 
 * Provides timestamp-based screenshot capture with automatic directory creation
 * and file existence verification. Used by both UI and storageState tests.
 * 
 * @example
 * const filename = screenshotUtils.generateScreenshotFilename();
 * await screenshotUtils.takeScreenshot(page, filename);
 */
class ScreenshotUtils {
  /**
   * Generates unique timestamp-based filename (format: screenshot-YYYY-MM-DDTHH-MM-SS.png)
   * 
   * @returns Screenshot filename with .png extension
   */
  generateScreenshotFilename(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/:/g, '-').split('.')[0];
    return `screenshot-${timestamp}.png`;
  }

  /**
   * Captures page screenshot and saves to screenshots/ directory
   * 
   * @param page - Playwright page object to screenshot
   * @param filename - Screenshot filename (use generateScreenshotFilename())
   * @returns Absolute path to saved screenshot
   */
  async takeScreenshot(page: Page, filename: string): Promise<string> {
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const screenshotPath = path.join(screenshotDir, filename);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    console.log(`Screenshot saved to: ${screenshotPath}`);
    return screenshotPath;
  }

  /**
   * Verifies screenshot file exists on disk
   * 
   * @param filename - Screenshot filename to check
   * @returns true if file exists, false otherwise
   */
  screenshotExists(filename: string): boolean {
    const screenshotPath = path.join(process.cwd(), 'screenshots', filename);
    return fs.existsSync(screenshotPath);
  }
}

export default new ScreenshotUtils();
