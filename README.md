# YouTube E2E Test Automation - Dual Authentication Strategy

## 📋 Table of Contents
- [Overview](#-overview)
- [The Problem: Google Authentication in CI](#-the-problem-google-authentication-in-ci)
- [The Solution: Dual Authentication Strategy](#-the-solution-dual-authentication-strategy)
- [Architecture & Project Structure](#️-architecture--project-structure)
- [CI/CD Setup: Dual Runner Strategy](#️-cicd-setup-dual-runner-strategy)
- [Installation & Setup](#-installation--setup)
- [Running Tests](#-running-tests)
- [Test Coverage](#-test-coverage)
- [Troubleshooting](#-troubleshooting)
- [Key Components](#-key-components)
- [Best Practices](#-best-practices)

---

## 🎯 Overview

This project implements a **Playwright TypeScript E2E testing framework** for YouTube automation with a sophisticated **dual authentication strategy**. The framework demonstrates how to handle Google authentication in CI/CD environments where traditional UI-based login is blocked by CAPTCHA and bot detection.

**Key Features:**
- ✅ **Two authentication approaches** (UI-based and StorageState pre-authenticated)
- ✅ **Dual CI/CD runner strategy** (GitHub-hosted and self-hosted runners)
- ✅ **Page Object Model (POM)** design pattern
- ✅ **TypeScript** for type safety
- ✅ **Multi-environment support** (QA/UAT/LIVE)
- ✅ **Comprehensive test coverage** (search, playback, seek, screenshot, verification)
- ✅ **Intelligent ad handling** (automatic skip)
- ✅ **Detailed logging and reporting**

---

## ❌ The Problem: Google Authentication in CI

### The Challenge

When automating tests that require Google authentication (YouTube, Gmail, Drive, etc.), you face a critical problem in CI/CD environments:

**Google's Bot Detection Blocks Automated Logins on CI Runners**

```
❌ GitHub-hosted runners (ubuntu-latest)
   → Use datacenter IP addresses
   → Google flags as suspicious
   → Triggers CAPTCHA verification
   → Automated login FAILS
   → Tests cannot proceed
```

### Why This Happens

1. **IP-Based Detection**: GitHub Actions runners use AWS/Azure datacenter IP ranges that Google identifies as high-risk
2. **Browser Fingerprinting**: Even with anti-automation flags, Google can detect Playwright/Selenium
3. **Behavioral Analysis**: Automated scripts interact with forms faster/differently than humans
4. **Security Policy**: Google actively prevents automated access to protect user accounts

---

## ✅ The Solution: Dual Authentication Strategy

We solve this by implementing **TWO parallel authentication approaches**:

### Comparison Table

| Feature | UI-Based Auth (001) | StorageState Auth (002) |
|---------|---------------------|-------------------------|
| **Authentication Method** | Google OAuth UI login | Pre-saved cookies/localStorage |
| **Execution Time** | ~32 seconds | ~18 seconds (14s faster!) |
| **Works on GitHub-hosted** | ❌ No (CAPTCHA) | ✅ Yes |
| **Works on Self-hosted** | ✅ Yes | ✅ Yes |
| **Tests Login Flow** | ✅ Yes | ❌ No |
| **Maintenance** | Low | Medium (regenerate when expired) |

### Approach 1: UI-Based Authentication

**Test File:** `tests/UI/001_youtube_e2e_UI.spec.ts`

**How it works:**
1. Navigate to YouTube → Click "Sign in"
2. Redirects to accounts.google.com
3. Enter email → Click "Next"
4. Enter password → Click "Next"
5. Google validates → Redirects to YouTube
6. Session cookies set → User authenticated

**When to use:** Local testing, self-hosted runners, testing login flow

### Approach 2: StorageState Authentication

**Test File:** `tests/UI/002_youtube_e2e_storagestate.spec.ts`

**How it works:**
1. Load saved authentication file (playwright/.auth/user.json)
2. Playwright injects cookies into browser
3. Navigate to YouTube → Already authenticated!
4. No login UI needed → Test proceeds immediately

**When to use:** CI/CD environments, GitHub-hosted runners, faster execution

**Generate auth state:**
```bash
npm run Generate:auth
```

---

## 🏗️ Architecture & Project Structure

```
Playwright_Ts_Automation_Sample/
├── .github/workflows/
│   └── playwright-tests.yml       # Dual-job CI/CD workflow (StorageState + UI)
├── src/
│   ├── pages/                     # Page Object Model
│   │   ├── YouTubePage.ts         # YouTube page interactions (14 locators, 10 methods)
│   │   └── GoogleLoginPage.ts     # Google OAuth login flow (6 locators, 7 methods)
│   ├── utils/                     # Reusable utilities
│   │   ├── videoHelper.ts         # Video control (play, pause, seek, time tracking)
│   │   ├── ScreenshotUtils.ts     # Screenshot management (timestamp-based filenames)
│   │   ├── jsonhelper.ts          # JSON config reader with password decryption
│   │   └── encryptionHelper.ts    # AES-256-GCM encryption/decryption utilities
│   ├── types/                     # TypeScript type definitions
│   │   ├── index.ts               # Common types and interfaces
│   │   └── test-options.ts        # Test configuration types
│   └── data/UI/                   # Test data files (JSON)
│       ├── 001_youtube_e2e_UI.json           # UI test data
│       └── 002_youtube_e2e_storagestate.json # StorageState test data
├── tests/
│   ├── authSetup/
│   │   └── auth.setup.ts          # Authentication state generator
│   └── UI/
│       ├── 001_youtube_e2e_UI.spec.ts           # UI auth test (with Google login)
│       └── 002_youtube_e2e_storagestate.spec.ts # Pre-authenticated test
├── scripts/
│   └── encryptPassword.ts         # Password encryption CLI utility
├── playwright/.auth/              # Auth state files (gitignored)
│   └── user.json                  # Google session cookies and localStorage
├── .env                           # Local environment variables (gitignored)
├── config.json                    # Environment config (with encrypted passwords)
├── playwright.config.ts           # Playwright config (loads dotenv)
├── package.json                   # Dependencies and npm scripts
└── README.md                      # This file
```

---

## ⚙️ CI/CD Setup: Dual Runner Strategy

### GitHub Actions Overview

**File:** `.github/workflows/playwright-tests.yml`

**Two separate jobs run in parallel:**

**Job 1: test-storagestate (GitHub-hosted)**
- Runner: `ubuntu-latest` (free)
- Uses pre-authenticated storageState
- Bypasses Google login UI
- Test: `002_youtube_e2e_storagestate.spec.ts`

**Job 2: test-ui (Self-hosted)**
- Runner: `self-hosted` (your machine)
- Performs Google OAuth login via UI
- Requires trusted IP
- Test: `001_youtube_e2e_UI.spec.ts`

### Setting Up Self-Hosted Runner

1. **Navigate to GitHub Settings:**
   ```
   Repository → Settings → Actions → Runners → New self-hosted runner
   ```

2. **Download and Configure:**
   ```bash
   # Follow GitHub's OS-specific instructions
   ./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN
   ```

3. **Start Runner:**
   ```bash
   ./run.sh  # Or install as service
   ```

### GitHub Secret: YOUTUBE_AUTH_STATE

**Generate and add:**
```bash
# 1. Generate auth state locally
npm run Generate:auth

# 2. Base64 encode
cat playwright/.auth/user.json | base64 > YOUTUBE_AUTH_STATE.txt

# 3. Add to GitHub:
#    Settings → Secrets → Actions → New secret
#    Name: YOUTUBE_AUTH_STATE
#    Value: [Paste base64 content]
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Chrome browser

### Setup Steps

```bash
# 1. Clone repository
git clone https://github.com/fefundinfo-internal/Playwright_Ts_Automation_Sample.git
cd Playwright_Ts_Automation_Sample

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install
npx playwright install-deps

# 4. Configure credentials in config.json

# 5. Generate authentication state
npm run Generate:auth
```

## 🔐 Password Encryption

For security, passwords in `config.json` can be encrypted at rest and decrypted at runtime.

### Setup (One-time)

1. **Run the encryption utility**:
   ```bash
   npx ts-node scripts/encryptPassword.ts
   ```

2. **Follow the prompts**:
   - Enter your password (e.g., `Automation@Tester@1990`)
   - Enter a strong encryption key (generate with: `openssl rand -base64 32`)
   - Copy the encrypted output

3. **Update config.json**:
   ```json
   "password": "encrypted:BASE64_ENCRYPTED_STRING"
   ```

4. **Set encryption key locally using .env file (Recommended)**:
   
   Create a `.env` file in the project root:
   ```bash
   # .env file (already in .gitignore)
   ENCRYPTION_KEY=your-encryption-key-here
   ```
   
   The `dotenv` package automatically loads this file when tests run. This is the recommended approach for local development as it:
   - Eliminates the need to set environment variables in each terminal session
   - Works consistently across different operating systems
   - Keeps sensitive keys out of shell history
   
   **Alternative (Manual environment variable)**:
   ```bash
   # Linux/Mac
   export ENCRYPTION_KEY="your-encryption-key-here"
   
   # Windows (Command Prompt)
   set ENCRYPTION_KEY=your-encryption-key-here
   
   # Windows (PowerShell)
   $env:ENCRYPTION_KEY="your-encryption-key-here"
   ```

5. **Add to CI (GitHub Actions)**:
   - Go to repository Settings → Secrets → Actions
   - Add new secret: `ENCRYPTION_KEY` with your encryption key value
   - Workflow is already configured to use this secret in both test jobs

### How It Works

- **Encryption**: AES-256-GCM with PBKDF2 key derivation (industry standard, military-grade security)
- **Runtime Decryption**: Passwords prefixed with `encrypted:` are automatically decrypted when `config.json` is loaded
- **Local Development**: Encryption key loaded from `.env` file via `dotenv` package (imported in `playwright.config.ts`)
- **CI/CD**: Encryption key loaded from GitHub Secrets environment variable
- **Backward Compatible**: Plaintext passwords still work if not prefixed with `encrypted:`

### Security Notes

- **Never commit** the encryption key to the repository (`.env` file is already in `.gitignore`)
- **Never commit** the `.env` file to version control
- Store encryption key securely (password manager, GitHub Secrets, `.env` file locally)
- Regenerate encrypted passwords if encryption key is compromised
- Encrypted passwords in `config.json` are safer than plaintext, but you must protect your encryption key
- The `.env` file approach resolves TypeScript module resolution issues and improves developer experience

---


---

## 🧪 Running Tests

### Local Execution

```bash
# Run all tests (headless)
npm run test:e2e:headless

# Run all tests (headed - browser visible)
npm run test:e2e:headed

# Run UI test specifically (with Google login)
npm run Ui:headed

# Run storageState test specifically (pre-authenticated)
npm run storage:headed

# Generate authentication state
npm run Generate:auth

# View test report
npm run test:report
```

### CI Execution

Tests run automatically on push/PR to `main` branch.

**Monitoring CI:**
1. Repository → Actions
2. Click workflow run
3. View job logs:
   - `test-storagestate` - StorageState tests
   - `test-ui` - UI tests with Google login

---

## 📊 Test Coverage

Both test files cover the same E2E scenario with different authentication:

### UI Test (001) - 7 Steps

1. **Google Sign-In** (~8s)
2. **Search and verify results** (~3s)
3. **Play video** (~11s)
4. **Pause video** (~2s)
5. **Seek forward** (~1s)
6. **Resume and screenshot** (~3s)
7. **Verify title** (~1s)

**Total:** ~32 seconds

### StorageState Test (002) - 6 Steps

**beforeEach:** Verify pre-authentication (~2s)

1. **Search and verify results** (~3s)
2. **Play video** (~4s)
3. **Pause video** (~2s)
4. **Seek forward** (~1s)
5. **Resume and screenshot** (~3s)
6. **Verify title** (~1s)

**Total:** ~18 seconds **(14s faster!)**

---

## 🔧 Troubleshooting

### Google Authentication Failures

**Problem:** CAPTCHA challenge during UI login  
**Solution:** Use storageState test or self-hosted runner

**Problem:** User avatar not found after login  
**Solution:** Increase wait timeout or check internet connection

### StorageState Test Failures

**Problem:** Auth state file not found  
**Solution:** Run `npm run Generate:auth`

**Problem:** User not authenticated (avatar not found)  
**Solution:** Regenerate auth state (session expired)

```bash
# Delete old state
rm playwright/.auth/user.json

# Generate fresh state
npm run Generate:auth
```

### CI Test Failures

**Problem:** GitHub Secret not found  
**Solution:** Add `YOUTUBE_AUTH_STATE` secret in repository settings

**Problem:** Self-hosted runner offline  
**Solution:** Check runner machine and restart service

### Local Test Failures

**Problem:** Browser not found  
**Solution:** Run `npx playwright install`

**Problem:** Tests pass locally but fail in CI  
**Solution:** Check environment variables, timeouts, dependencies

---

## 📝 Key Components

### YouTubePage
**File:** `src/pages/YouTubePage.ts`
- 14 locators for YouTube elements
- 10 methods for page interactions
- Intelligent ad detection and skipping
- Methods: `navigate()`, `searchFor()`, `clickFirstVideo()`, `clickSignIn()`, `isSignedIn()`

### GoogleLoginPage
**File:** `src/pages/GoogleLoginPage.ts`
- 6 locators for Google login elements
- 7 methods for OAuth flow
- Two-step authentication handling
- Methods: `performLogin()`, `enterEmail()`, `enterPassword()`

### VideoHelper
**File:** `src/utils/videoHelper.ts`
- 6 methods for video control
- Direct HTMLVideoElement API access
- Methods: `playVideo()`, `pauseVideo()`, `isVideoPlaying()`, `getCurrentTime()`, `skipForward()`

### ScreenshotUtils
**File:** `src/utils/ScreenshotUtils.ts`
- 3 methods for screenshot management
- Timestamp-based filenames
- Methods: `generateScreenshotFilename()`, `takeScreenshot()`, `screenshotExists()`

---

## 🎨 Best Practices

1. **Type Safety** - Full TypeScript with explicit types
2. **Page Object Model** - Separation of concerns
3. **Wait Strategies** - Explicit waits for reliability
4. **Error Handling** - Graceful degradation
5. **Test Organization** - Clear step structure
6. **Logging** - Comprehensive console output
7. **CI/CD Optimization** - Dual runner strategy
8. **Security** - Credentials never in code
9. **Maintainability** - Clean, documented code
10. **Performance** - StorageState for speed

---

## 📄 Additional Resources

- **Playwright Documentation:** https://playwright.dev/
- **TypeScript Documentation:** https://www.typescriptlang.org/
- **GitHub Actions:** https://docs.github.com/en/actions

---

**Last Updated:** October 2025  
**Framework Version:** 1.0.0  
**Playwright Version:** 1.56
