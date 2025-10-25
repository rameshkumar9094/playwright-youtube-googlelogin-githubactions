import { Page, Locator } from '@playwright/test';

/**
 * GoogleLoginPage - Handles Google OAuth Login Flow
 * 
 * Manages two-step authentication: email entry → password entry
 * Used by UI tests and auth.setup.ts to perform Google login.
 * 
 * Note: Works on self-hosted runners but may trigger CAPTCHA on GitHub-hosted runners.
 * For CI, prefer storageState approach (002_youtube_e2e_storagestate.spec.ts).
 */
class GoogleLoginPage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get emailInput(): Locator {
    return this.page.locator('input[type="email"]');
  }

  get nextButtonAfterEmail(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  get passwordInput(): Locator {
    return this.page.getByLabel('Enter your password');
  }

  get nextButtonAfterPassword(): Locator {
    return this.page.getByRole('button', { name: 'Next' });
  }

  get signInButton(): Locator {
    return this.page.locator('button[type="submit"]');
  }

  get errorMessage(): Locator {
    return this.page.locator('[role="alert"], .error-message');
  }

  async enterEmail(email: string): Promise<void> {
    await this.emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.emailInput.fill(email);
    console.log(`✓ Entered email: ${email}`);
  }

  async clickNextAfterEmail(): Promise<void> {
    await this.nextButtonAfterEmail.waitFor({ state: 'visible', timeout: 10000 });
    await this.nextButtonAfterEmail.click();
    await this.page.waitForLoadState('networkidle');
    console.log('✓ Clicked Next after email');
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.passwordInput.fill(password);
    console.log('✓ Entered password');
  }

  async clickNextAfterPassword(): Promise<void> {
    await this.nextButtonAfterPassword.waitFor({ state: 'visible', timeout: 10000 });
    await this.nextButtonAfterPassword.click();
    console.log('✓ Clicked Next after password');
  }

  /**
   * Performs complete Google OAuth login
   * 
   * Flow: Enter email → Next → Enter password → Next → Redirect to YouTube
   * Sets session cookies (SID, SSID, HSID) in browser for authenticated session.
   * 
   * @param email - Google account email
   * @param password - Google account password
   * @throws Error if login elements not found or CAPTCHA triggered
   */
  async performLogin(email: string, password: string): Promise<void> {
    console.log('Starting Google login process...');
    await this.enterEmail(email);
    await this.clickNextAfterEmail();
    await this.enterPassword(password);
    await this.clickNextAfterPassword();
    await this.page.waitForTimeout(3000);
    console.log('✓ Google login completed');
  }

  async isLoginSuccessful(): Promise<boolean> {
    try {
      const errorVisible = await this.errorMessage.isVisible({ timeout: 3000 });
      return !errorVisible;
    } catch {
      return true;
    }
  }
}

export default GoogleLoginPage;
