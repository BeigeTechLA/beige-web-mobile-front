// Run against a local frontend: node scripts/test-password-reset-ui.cjs
// Every API call is intercepted. No real emails, credentials or DB writes.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const base = 'http://127.0.0.1:3000';
const user = { id: 288, name: 'Test User', email: 'test@example.com', role: 'Admin', user_type_id: 1, is_internal_member: true, permissions_version: 4 };
const token = `e30.${Buffer.from(JSON.stringify({ userId: 288, permissionsVersion: 4, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-only`;

async function button(page, label) {
  await page.waitForFunction((text) => Array.from(document.querySelectorAll('button')).some((b) => b.textContent.trim() === text && !b.disabled), {}, label);
  await page.evaluate((text) => Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === text).click(), label);
}
async function code(page) {
  await page.waitForSelector('input[aria-label="Verification code digit 1"]');
  await page.$eval('input[aria-label="Verification code digit 1"]', (input) => {
    const data = new DataTransfer(); data.setData('text', '123456');
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true }));
  });
}
async function fill(page, selector, text) {
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace'); await page.type(selector, text);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    for (const mode of ['expiry', 'forgot']) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      await page.setViewport(mode === 'expiry' ? { width: 1440, height: 1100 } : { width: 390, height: 844 });
      const requests = []; const errors = [];
      let verificationCount = 0; let changeCount = 0;
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setRequestInterception(true);
      page.on('request', async (request) => {
        const url = new URL(request.url());
        const headers = { 'access-control-allow-origin': base, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-credentials': 'true' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.includes('/v1/')) {
          requests.push({ path: url.pathname, body: request.postData() ? JSON.parse(request.postData()) : null });
          let status = 200; let body = { success: true, data: {}, user, permissions: {} };
          if (url.pathname.endsWith('/request-otp')) body = { success: true, message: 'Verification code sent.', retry_after_seconds: 1 };
          if (url.pathname.endsWith('/verify-otp')) {
            verificationCount++;
            if (mode === 'expiry' && verificationCount === 1) { status = 400; body = { message: 'Incorrect verification code. Please try again.' }; }
            else if (mode === 'expiry' && verificationCount === 2) { status = 400; body = { code: 'OTP_EXPIRED', message: 'Code expired. Please request a new code.' }; }
            else if (mode === 'expiry' && verificationCount === 3) { status = 429; body = { code: 'OTP_BLOCKED', retry_after_seconds: 2, message: 'Too many failed OTP attempts.' }; }
            else body = { success: true, message: 'Email verified.', resetProof: 'a'.repeat(64) };
          }
          if (url.pathname.endsWith('/change') || url.pathname.endsWith('/forgot-password/reset')) {
            changeCount++;
            if (mode === 'expiry' && changeCount === 1) { status = 400; body = { message: 'Your current password is incorrect.' }; }
            else body = { success: true, message: 'Password updated successfully.', token, user, permissions: {} };
          }
          return request.respond({ status, contentType: 'application/json', headers, body: JSON.stringify(body) });
        }
        // Local assets/pages only; block external services and analytics.
        if (url.origin === base) return request.continue();
        return request.abort();
      });
      await page.goto(`${base}/${mode === 'expiry' ? 'password-expired' : 'forgot-password'}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      if (mode === 'forgot') {
        await page.waitForSelector('#reset-email');
        await page.type('#reset-email', 'test@example.com');
      }
      await button(page, 'Reset Password');
      await code(page);
      if (mode === 'expiry') {
        await button(page, 'Verify OTP');
        await page.waitForFunction(() => document.body.textContent.includes('Incorrect verification code.'));
        await button(page, 'Verify OTP');
        await page.waitForFunction(() => document.body.textContent.includes('Code expired.'));
        await button(page, 'Resend OTP');
        await code(page); await button(page, 'Verify OTP');
        await page.waitForFunction(() => document.body.textContent.includes('Too many failed OTP attempts.'));
        assert.equal(await page.$eval('input[aria-label="Verification code digit 1"]', (input) => input.matches(':disabled')), true);
        await button(page, 'Resend OTP');
        await code(page);
      }
      await button(page, 'Verify OTP');
      await page.waitForSelector('#password');
      assert.equal(Boolean(await page.$('#current-password')), mode === 'expiry');
      if (mode === 'expiry') {
        await page.type('#current-password', 'Old-Test-Password-123!');
        await page.type('#password', 'Old-Test-Password-123!');
        await page.type('#confirm-password', 'Old-Test-Password-123!');
        assert.equal(await page.$eval('button[type="submit"]', (b) => b.disabled), true);
      }
      await fill(page, '#password', 'New-Test-Password-456!');
      await fill(page, '#confirm-password', 'New-Test-Password-456!');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      await page.screenshot({ path: `/tmp/beige-${mode}-password-form.png`, fullPage: true });
      await button(page, 'Update Password');
      if (mode === 'expiry') {
        await page.waitForFunction(() => document.body.textContent.includes('Your current password is incorrect.'));
        await fill(page, '#current-password', 'Correct-Old-Password-123!');
        await button(page, 'Update Password');
      }
      await page.waitForFunction(() => document.body.textContent.includes('Password updated successfully.'));
      assert.ok((await page.cookies()).some((cookie) => cookie.name === 'revure_token' && cookie.value === token));
      const change = requests.findLast((r) => r.path.endsWith('/change') || r.path.endsWith('/forgot-password/reset'));
      assert.equal(change.body.resetProof, 'a'.repeat(64));
      assert.equal('currentPassword' in change.body, mode === 'expiry');
      assert.equal(requests.some((r) => r.path.endsWith('/logout')), false);
      await page.screenshot({ path: `/tmp/beige-${mode}-password-success.png`, fullPage: true });
      // The CTA must target the role's dashboard with the new credentials.
      assert.ok(await page.evaluate(() => Array.from(document.querySelectorAll('button')).some((b) => b.textContent.includes('Continue to Dashboard'))));
      assert.deepEqual(errors, []);
      await Promise.all([
        page.waitForRequest((request) => new URL(request.url()).pathname === '/admin/dashboard'),
        button(page, 'Continue to Dashboard')
      ]);
      console.log(`${mode}: OTP UI, validation, success screen and fresh-session persistence passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
