/** Optional browser check. Start npm run dev first; see docs/V2_FRONTEND_M1.md.
 * All Firebase responses and images are fixtures. No external writes or real logins.
 */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
});
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const output = process.env.TEST_OUTPUT || '/tmp/mcs-v2-check';
await mkdir(output, { recursive: true });
const fixtures = {
  event: [{ id: 'qa-event', published: true, title: 'MCS Symposium 2026',
    university: 'Divine Word University', department: 'Mathematics and Computing Science',
    eventDate: '2030-06-21', eventStartTime: '09:00', venue: 'QA venue', location: 'Madang',
    heroTagline: 'Frontend validation fixture', heroImageUrl: '/qa/banner.svg',
    aboutTitle: 'Ideas into impact', aboutContent: 'Synthetic content for frontend validation only.',
    hodName: 'QA department representative', hodMessage: 'Test welcome message.',
    whatsappNumber: '67500000000' }],
  gallery: [
    { id: 'one', published: true, image: '/qa/one.svg', title: 'QA image one' },
    { id: 'two', published: true, image: '/qa/two.svg', title: 'QA image two' },
    { id: 'private', published: false, image: '/qa/private.svg', title: 'UNPUBLISHED' },
  ],
  presenters: [{ id: 'qa-presenter', published: true, name: 'QA Presenter', topic: 'QA project',
    projectDescription: 'Test project description', speakerType: 'presenter' }],
  schedule: [{ id: 'qa-session', published: true, title: 'QA opening session', time: '09:00', segment: 1 }],
  sponsors: [{ id: 'qa-sponsor', name: 'QA Gold Sponsor', published: true, tier: 'gold', logo: '/qa/logo.svg' }],
  documents: [{ id: 'qa-doc', published: true, title: 'QA programme', url: '/qa/programme.pdf' }],
  announcements: [], staff: [],
};
const firestoreMock = `
export const collection = (_db, name) => ({ name });
export const doc = (_db, name, id) => ({ name, id });
export const where = (key, op, value) => ({ key, op, value });
export const limit = (count) => ({ count });
export const orderBy = () => ({});
export const query = (collection, ...constraints) => ({ ...collection, constraints });
export const getDoc = async () => ({ exists: () => false });
export const getDocs = async (q) => {
  window.__queries.push(q);
  await new Promise(resolve => setTimeout(resolve, 40));
  if (window.__galleryFailure && q.name === 'gallery') throw Error('QA gallery unavailable');
  let items = window.__fixtures[q.name] || [];
  for (const rule of q.constraints || []) {
    if (rule.key) items = items.filter(item => item[rule.key] === rule.value);
    if (rule.count) items = items.slice(0, rule.count);
  }
  const docs = items.map(item => ({ id: item.id, data: () => item }));
  return { empty: !docs.length, docs };
};`;
async function open({ width = 1440, reducedMotion = 'no-preference', data = fixtures, galleryFailure = false, brokenImages = false, path = '/' } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion, timezoneId: 'America/New_York' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ data, galleryFailure }) => {
    window.__fixtures = data; window.__queries = []; window.__galleryFailure = galleryFailure;
  }, { data, galleryFailure });
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === '/src/services/firebase.ts') return route.fulfill({ contentType: 'application/javascript', body: 'export const db = {}; export const auth = {}; export const storage = {}; export default {};' });
    if (url.pathname.endsWith('/firebase_firestore.js')) return route.fulfill({ contentType: 'application/javascript', body: firestoreMock });
    if (url.pathname.endsWith('/firebase_auth.js')) return route.fulfill({ contentType: 'application/javascript', body: 'export const signInWithEmailAndPassword = async () => { throw Error("QA disabled"); }; export const signOut = async () => {}; export const onAuthStateChanged = () => () => {};' });
    if (url.pathname.startsWith('/qa/')) {
      if (brokenImages) return route.abort();
      return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#692943"/><circle cx="950" cy="350" r="260" fill="#ba8b7b"/></svg>' });
    }
    return route.continue();
  });
  await page.goto(origin + path);
  await page.locator(path === '/admin' ? '.admin-login-card' : '.v2-site').waitFor();
  if (path !== '/admin' && data.event.length) await page.locator('.v2-event-hero h1').waitFor();
  return { page, context, errors };
}
async function settle(page) { await page.waitForTimeout(200); }
async function noOverflow(page) {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow');
}
try {
  const { page, context, errors } = await open();
  await page.locator('.v2-hero-position b').waitFor();
  assert.equal(await page.locator('.v2-hero-backdrops img').count(), 3);
  assert.match(await page.locator('.event-hero-meta').innerText(), /9:00 am PNG Time/i);
  assert.match(await page.locator('.event-hero-meta').innerText(), /21 June 2030/);
  assert.equal(await page.getByRole('link', { name: 'Open QA programme' }).getAttribute('href'), '/qa/programme.pdf');
  assert.match(await page.getByRole('link', { name: 'Chat on WhatsApp' }).getAttribute('href'), /^https:\/\/wa.me\//);
  await noOverflow(page);
  await settle(page);
  await page.waitForTimeout(6300);
  assert.equal(await page.locator('.v2-hero-position b').innerText(), '02', 'automatic rotation');
  await page.getByRole('button', { name: 'Next background' }).click();
  assert.equal(await page.locator('.v2-hero-position b').innerText(), '03');
  await page.waitForTimeout(6300);
  assert.equal(await page.locator('.v2-hero-position b').innerText(), '03', 'manual navigation pauses rotation');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await page.locator('h1').click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(6300);
  assert.equal(await page.locator('.v2-hero-position b').innerText(), '01', 'resumes after interaction');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(6300);
  assert.equal(await page.locator('.v2-hero-position b').innerText(), '01', 'live reduced-motion change stops rotation');
  assert.equal(await page.getByRole('button', { name: /Pause|Resume/ }).count(), 0);
  await page.getByRole('button', { name: 'Next background' }).click();
  assert.equal(await page.locator('.v2-hero-position b').innerText(), '02', 'manual navigation available with reduced motion');
  await page.getByRole('button', { name: 'View Project', exact: true }).click();
  await page.locator('#presenter-modal-title').waitFor();
  assert.equal(await page.locator('.presenter-modal').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.presenter-modal').count(), 0);
  await page.locator('.schedule-compact-trigger').first().click();
  assert.equal(await page.locator('.schedule-compact-trigger').first().getAttribute('aria-expanded'), 'true');
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(150);
  assert(await page.locator('.v2-scroll-progress > div').evaluate(el => Number(getComputedStyle(el).transform.split(',')[0].replace('matrix(', '')) > 0.95));
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(150);
  await page.screenshot({ path: output + '/desktop.png' });
  assert.deepEqual(errors, []);
  await context.close();
  console.log('PASS desktop rotation, pause/resume, reduced motion, PNG time, presenter modal, schedule, links, scroll progress');

  for (const width of [320, 390, 768, 1024]) {
    const { page, context, errors } = await open({ width, reducedMotion: 'reduce' });
    await settle(page);
    await noOverflow(page);
    const menu = page.getByRole('button', { name: 'Open navigation menu' });
    if (await menu.isVisible()) {
      await menu.click();
      assert.equal(await page.locator('#public-navigation').isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#public-navigation').isVisible(), false);
      assert.equal(await menu.evaluate(el => document.activeElement === el), true);
      await menu.click();
      await page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'About', exact: true }).click();
      assert.equal(await page.locator('#public-navigation').isVisible(), false);
      assert.equal(new URL(page.url()).hash, '#symposium');
      assert(await page.locator('#symposium').evaluate(el => el.getBoundingClientRect().top >= 0), 'anchor target under sticky header');
    }
    if (width === 390) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.screenshot({ path: output + '/mobile.png' });
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log('PASS responsive navigation and layout at ' + width + 'px');
  }
  for (const options of [
    { data: { ...fixtures, gallery: [] } },
    { galleryFailure: true },
    { brokenImages: true },
    { data: { ...fixtures, event: [{ ...fixtures.event[0], heroImageUrl: '' }], gallery: [] } },
    { data: { ...fixtures, event: [] } },
  ]) {
    const { page, context, errors } = await open(options);
    await settle(page);
    assert.equal(await page.locator('.v2-hero-controls').count(), 0);
    await noOverflow(page);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS empty gallery, failed gallery, broken images, no images, unpublished event');
  const admin = await open({ path: '/admin' });
  assert.equal(await admin.page.locator('.v2-site, .v2-scroll-progress').count(), 0);
  assert.equal(await admin.page.locator('#admin-email').isVisible(), true);
  assert.deepEqual(admin.errors, []);
  await admin.context.close();
  console.log('PASS admin login route isolation; no authentication or writes performed');
} finally {
  await browser.close();
}
