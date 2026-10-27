// Run with the local frontend running: node scripts/test-quote-editor-ui.cjs
// Add --sales to mount the legacy sales editor in a temporary local admin route.
// Middleware redirects the old /sales portal, so this exercises its component directly.
// All API requests are mocked; no real quotes are read or changed.
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.QUOTE_TEST_BASE_URL || 'http://127.0.0.1:3000';
const testSales = process.argv.includes('--sales');
let route = process.env.QUOTE_TEST_ROUTE || '/admin/quotes/create';
const labels = ['Highlight Film', 'Social Reels', 'Full Length Edit', 'Photo Retouching'];
const types = labels.map((label, index) => ({ id: index + 11, label, key: `edit_${index}`, is_system_default: 1 }));
const permissions = Object.fromEntries(['admin_quotes_all_quotes', 'quotes', 'dashboard'].map(key => [key, { view: true, edit: true, create: true }]));
const user = { id: 999, name: 'Quote Test', email: 'quote-test@example.com', user_type_id: 1, is_internal_member: true };
const token = `e30.${Buffer.from(JSON.stringify({ userId: 999, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-only`;
const quote = {
  sales_quote_id: 999, quote_number: 'TEST-999', status: 'draft',
  client_id: 9, client_name: 'Saved Client', client_email: 'client@example.com', client_phone: '2025550123',
  client_address: '123 Main Street', location: '123 Main Street', project_description: 'Editing regression test',
  booking_type: 'single_day', start_date: '2027-03-10', start_time: '10:00:00', end_time: '14:00:00', time_zone: 'America/New_York',
  video_shoot_type: `Editing: ${labels.join(', ')}`, valid_until: '2027-04-10',
  updated_at: '2026-10-27T00:00:00Z',
  line_items: types.map((type, i) => ({
    line_item_id: 100 + i, catalog_item_id: 3, section_type: 'service', item_name: 'Editing',
    quantity: i + 1, unit_rate: (i + 1) * 100, estimated_pricing: (i + 1) * 100,
    configuration: { editing_type_key: type.key, editing_type_label: type.label },
  })),
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function clickButton(page, label) {
  await page.waitForFunction(text => [...document.querySelectorAll('button')].some(b => b.textContent.trim() === text && !b.disabled), {}, label);
  await page.evaluate(text => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text && !b.disabled).click(), label);
}
async function assertSelections(page, expected = labels) {
  await page.waitForFunction(() => document.querySelectorAll('button[aria-pressed="true"]').length > 0);
  const selected = await page.$$eval('button[aria-pressed="true"]', buttons => buttons.map(b => b.textContent.trim()));
  assert.deepEqual(selected.sort(), [...expected].sort());
}

(async () => {
  let harnessDirectory;
  if (testSales) {
    harnessDirectory = fs.mkdtempSync(path.join(__dirname, '../app/admin/quotes/regression-harness-'));
    fs.writeFileSync(path.join(harnessDirectory, 'page.tsx'), 'export { default } from \"@/app/sales/quotes/create/page\";\n');
    route = `/admin/quotes/${path.basename(harnessDirectory)}`;
  }
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    for (const scenario of ['direct', 'cached-details', 'serialized-config', 'key-only', 'custom-type', 'direct-save', 'load-error']) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await page.setViewport({ width: 1440, height: 1100 });
      const errors = [];
      const requests = [];
      let editingResponded = false;
      const currentQuote = structuredClone(quote);
      if (scenario === 'serialized-config') {
        currentQuote.line_items.forEach(item => { item.configuration_json = JSON.stringify(item.configuration); delete item.configuration; });
      }
      if (scenario === 'key-only') currentQuote.line_items.forEach(item => { delete item.configuration.editing_type_label; });
      if (scenario === 'custom-type') {
        currentQuote.line_items[3].configuration = { editing_type_key: 'custom_saved', editing_type_label: 'Saved Custom Edit', is_custom_editing_type: true };
      }
      await page.setCookie(...Object.entries({ revure_token: token, revure_user: JSON.stringify(user), revure_permissions: JSON.stringify(permissions) }).map(([name, value]) => ({ name, value: encodeURIComponent(value), url: base })));
      await page.evaluateOnNewDocument((cached, user) => {
        localStorage.setItem('revure_user', JSON.stringify(user));
        if (cached) sessionStorage.setItem('quote-editor-navigation:999', JSON.stringify({ cachedAt: Date.now(), quote: cached }));
        window.__quoteFormStates = [];
        const observe = () => {
          new MutationObserver(() => {
            const form = Boolean(document.querySelector('input[value="Saved Client"], button[aria-pressed]'));
            const state = form ? 'form' : document.body.textContent.includes('Loading quote details...') ? 'loading' : 'other';
            if (window.__quoteFormStates.at(-1) !== state) window.__quoteFormStates.push(state);
          }).observe(document.body, { childList: true, subtree: true, attributes: true });
        };
        document.addEventListener('DOMContentLoaded', observe);
      }, scenario === 'cached-details' ? { ...quote, line_items: quote.line_items.slice(0, 1) } : null, user);
      page.on('pageerror', error => errors.push(error.message));

      await page.setRequestInterception(true);
      page.on('request', async request => {
        const url = new URL(request.url());
        const headers = { 'access-control-allow-origin': base, 'access-control-allow-headers': request.headers()['access-control-request-headers'] || 'authorization,content-type', 'access-control-allow-methods': 'GET,POST,PUT,PATCH,OPTIONS', 'access-control-allow-credentials': 'true' };
        if (request.method() === 'OPTIONS') return request.respond({ status: 204, headers });
        if (url.pathname.includes('/v1/') || (url.origin !== base && ['xhr', 'fetch'].includes(request.resourceType()))) {
          requests.push({ path: url.pathname, method: request.method(), body: request.postData() });
          let body = { success: true, data: [] };
          let status = 200;
          if (url.pathname.includes('permissions')) body.data = permissions;
          if (url.pathname.endsWith('/auth/me')) body = { success: true, data: { user, permissions }, user, permissions };
          if (url.pathname.endsWith('/sales/quotes/999')) {
            await delay(450);
            if (scenario === 'load-error') { status = 500; body = { success: false, message: 'Quote unavailable' }; }
            else body.data = currentQuote;
          }
          if (url.pathname.endsWith('/versions')) body.data = [{ version_number: 1, is_current: true }];
          if (url.pathname.endsWith('/catalog')) {
            await delay(100);
            body.data = { service: [{ catalog_item_id: 3, name: 'Editing', effective_rate: '100' }], addon: [], logistics: [], custom: [] };
          }
          if (url.pathname.endsWith('/ai-editing-types')) {
            await delay(1000);
            body.data = { video_edit_types: types.slice(0, 3), photo_edit_types: types.slice(3) };
            editingResponded = true;
          }
          return request.respond({ status, headers, contentType: 'application/json', body: JSON.stringify(body) });
        }
        if (url.origin === base) return request.continue();
        return request.abort();
      });
      try {
        await page.goto(`${base}${route}?quoteId=999${scenario === 'direct-save' ? '' : '&editMode=full'}&view=${scenario === 'cached-details' ? 'details' : 'services'}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
        if (scenario === 'load-error') {
          await page.waitForSelector('[role="alert"]');
          assert.equal(await page.$('button[aria-pressed]'), null);
        } else {
          await page.waitForFunction(() => Boolean(document.querySelector('input[value="Saved Client"], button[aria-pressed]')));
          assert.equal(editingResponded, true, 'The form must wait for saved editing selections');
          if (scenario === 'cached-details') await clickButton(page, 'Continue');
          await assertSelections(page, scenario === 'custom-type' ? [...labels.slice(0, 3), 'Saved Custom Edit'] : labels);
          const cards = await page.$$eval('h3', headings => headings.filter(h => h.textContent.startsWith('Editing Type -')).map(h => {
            const card = h.parentElement.parentElement.parentElement;
            return { label: h.querySelector('span').textContent, prices: [...card.querySelectorAll('input')].map(i => i.value), text: card.innerText };
          }));
          assert.equal(cards.length, 4, 'Each saved editing type needs its own configuration');
          cards.forEach((card, i) => {
            assert.ok(card.prices.some(price => Number(price.replace(/[$,]/g, '')) === (i + 1) * 100), `Saved rate for ${card.label}`);
            assert.ok(card.text.includes(`$${((i + 1) ** 2 * 100).toFixed(2)}`), `Saved quantity and total for ${card.label}`);
          });
          await delay(1200);
          await assertSelections(page, scenario === 'custom-type' ? [...labels.slice(0, 3), 'Saved Custom Edit'] : labels);
          const states = await page.evaluate(() => window.__quoteFormStates);
          assert.equal(states.slice(states.indexOf('form') + 1).includes('loading'), false, 'The editor must not return to loading after appearing');
          assert.equal(requests.filter(r => r.path.endsWith('/ai-editing-types')).length, 1, 'Hydration should load the editing catalog once');
          if (scenario === 'direct-save') {
            await clickButton(page, 'Save');
            for (let attempt = 0; attempt < 50 && !requests.some(r => r.method === 'PUT'); attempt++) await delay(100);
            const save = requests.find(r => r.method === 'PUT');
            assert.ok(save, 'The service step must submit an update');
            const payload = JSON.parse(save.body);
            assert.equal(payload.line_items.length, 4, 'Saving must retain all four editing types');
            payload.line_items.forEach((item, i) => {
              assert.equal(item.configuration.editing_type_key, types[i].key);
              assert.equal(item.quantity, i + 1);
              assert.equal(item.estimated_pricing ?? item.unit_rate, (i + 1) * 100);
            });
          } else if (scenario === 'cached-details') {
            await clickButton(page, 'Back');
            await page.waitForSelector('input[value="Saved Client"]');
            await clickButton(page, 'Continue');
            await assertSelections(page);
          }
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${route}: ${scenario}`);
      } catch (error) {
        console.error('URL:', page.url(), 'Requests:', requests.map(r => r.path));
        console.error((await page.evaluate(() => document.body.innerText)).slice(-7000));
        console.error('Browser errors:', errors);
        throw error;
      } finally { await context.close(); }
    }
  } finally {
    if (browser) await browser.close();
    if (harnessDirectory) {
      fs.unlinkSync(path.join(harnessDirectory, 'page.tsx'));
      fs.rmdirSync(harnessDirectory);
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
