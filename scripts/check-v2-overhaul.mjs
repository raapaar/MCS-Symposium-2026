/** Optional browser check. Start npm run dev first; see docs/V2_FRONTEND_M1.md.
 * All Firebase responses and images are fixtures. No external writes or real logins.
 */
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:5173";
const output = process.env.TEST_OUTPUT || "/tmp/mcs-v2-overhaul-check";
await mkdir(output, { recursive: true });
const fixtures = {
  event: [
    {
      id: "qa-event",
      published: true,
      title: "MCS Symposium 2026",
      university: "Divine Word University",
      department: "Mathematics and Computing Science",
      eventDate: "2030-06-21",
      eventStartTime: "09:00",
      venue: "QA venue",
      location: "Madang",
      heroTagline: "Frontend validation fixture",
      heroImageUrl: "/qa/banner.svg",
      aboutTitle: "Ideas into impact",
      aboutContent: "Synthetic content for frontend validation only.",
      hodName: "QA department representative",
      hodMessage: "Test welcome message.",
      whatsappNumber: "67500000000",
    },
  ],
  gallery: [
    { id: "one", published: true, image: "/qa/one.svg", title: "QA image one" },
    { id: "two", published: true, image: "/qa/two.svg", title: "QA image two" },
    {
      id: "private",
      published: false,
      image: "/qa/private.svg",
      title: "UNPUBLISHED",
    },
  ],
  presenters: [
    {
      id: "qa-presenter",
      published: true,
      name: "QA Presenter",
      topic: "QA project",
      projectDescription: "Test project description",
      speakerType: "presenter",
    },
  ],
  schedule: [
    {
      id: "qa-session",
      published: true,
      title: "QA opening session",
      time: "09:00",
      segment: 1,
    },
  ],
  sponsors: [
    {
      id: "qa-sponsor",
      name: "QA Gold Sponsor",
      published: true,
      tier: "gold",
      logo: "/qa/logo.svg",
    },
  ],
  documents: [
    {
      id: "qa-doc",
      published: true,
      title: "QA programme",
      url: "/qa/programme.pdf",
    },
  ],
  merchandise: [
    {
      id: "qa-shirt",
      title: "QA Symposium Tee",
      description: "Test merchandise",
      category: "Apparel",
      image: "/qa/shirt.svg",
      priceCents: 5000,
      published: true,
      available: true,
      paymentInstructions: "QA bank instructions",
    },
    {
      id: "qa-hidden",
      title: "Private product",
      published: false,
      priceCents: 1,
    },
  ],
  storeOrders: [],
  announcements: [
    {
      id: "qa-update",
      title: "QA live update",
      date: "2030-06-01",
      summary: "Test announcement",
      published: true,
    },
  ],
  staff: [],
};
const firestoreMock = `
export const collection = (_db, name) => ({ name });
export const doc = (_db, name, id) => ({ name, id });
export const where = (key, op, value) => ({ key, op, value });
export const limit = (count) => ({ count });
export const orderBy = () => ({});
export const query = (collection, ...constraints) => ({ ...collection, constraints });
export const getDoc = async (q) => ({ exists: () => q.name === 'users', data: () => ({ role: window.__role || 'customer', active: true }) });
export const serverTimestamp = () => 'QA timestamp';
export const updateDoc = async (q, data) => { window.__writes.push({ q, data }); };
export const setDoc = async (q, data) => { window.__writes.push({ q, data }); };
export const addDoc = async (q, data) => {
  window.__writes.push({ q, data });
  const result = { id: 'qa-created', ...data };
  (window.__fixtures[q.name] ||= []).push(result);
  window.__notify(q.name); return result;
};
export const onSnapshot = (q, next, error) => {
  let active = true;
  const emit = () => {
    if (!active) return;
    if (q.id) next({ exists: () => q.name === 'users', data: () => q.name === 'users' ? { role: window.__role || 'customer', active: true } : undefined });
    else getDocs(q).then(s => { if (active) next(s); }).catch(e => { if (active) error?.(e); });
  };
  window.__listeners ||= []; const listener = { name: q.name, emit }; window.__listeners.push(listener);
  window.__notify = name => window.__listeners.filter(l => l.name === name).forEach(l => l.emit());
  setTimeout(emit, 0); return () => { active = false; window.__listeners = window.__listeners.filter(l => l !== listener); };
};
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
async function open({
  width = 1440,
  reducedMotion = "no-preference",
  data = fixtures,
  galleryFailure = false,
  brokenImages = false,
  path = "/",
  role = null,
} = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 1000 },
    reducedMotion,
    timezoneId: "America/New_York",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(
    ({ data, galleryFailure, role }) => {
      window.__fixtures = data;
      window.__queries = [];
      window.__galleryFailure = galleryFailure;
      window.__writes = [];
      window.__role = role;
      window.__user = role
        ? {
            uid: "qa-user",
            email: "qa@example.invalid",
            getIdToken: async () => "fixture-token",
          }
        : null;
    },
    { data, galleryFailure, role },
  );
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    if (url.pathname === "/src/services/firebase.ts")
      return route.fulfill({
        contentType: "application/javascript",
        body: "export const db = {}; export const auth = { get currentUser() { return window.__user; } }; export const storage = {}; export default { options: {} };",
      });
    if (url.pathname.endsWith("/firebase_firestore.js"))
      return route.fulfill({
        contentType: "application/javascript",
        body: firestoreMock,
      });
    if (url.pathname.endsWith("/firebase_auth.js"))
      return route.fulfill({
        contentType: "application/javascript",
        body: 'export const createUserWithEmailAndPassword = async () => { throw Error("QA disabled"); }; export const getAuth = () => ({}); export const signInWithEmailAndPassword = async () => { throw Error("QA disabled"); }; export const signOut = async () => {}; export const onAuthStateChanged = (_auth, callback) => { let active = true; setTimeout(() => { if (active) callback(window.__user); }, 0); return () => { active = false; }; };',
      });
    if (url.pathname.startsWith("/qa/")) {
      if (brokenImages) return route.abort();
      return route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#692943"/><circle cx="950" cy="350" r="260" fill="#ba8b7b"/></svg>',
      });
    }
    return route.continue();
  });
  await page.goto(origin + path);
  await page
    .locator(
      path === "/admin"
        ? ".admin-login-card"
        : ["/staff", "/superuser"].includes(path)
          ? role === "customer" || !role
            ? ".control-message"
            : ".control-portal"
          : ".v2-site",
    )
    .waitFor();
  if (path === "/" && data.event.length)
    await page.locator(".v2-event-hero h1").waitFor();
  return { page, context, errors };
}
async function settle(page) {
  await page.waitForTimeout(200);
}
async function noOverflow(page) {
  assert(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "horizontal overflow",
  );
}
try {
  const { page, context, errors } = await open();
  await page.locator(".v2-hero-position b").waitFor();
  assert.equal(await page.locator(".v2-hero-backdrops img").count(), 4);
  assert.match(
    await page.locator(".event-hero-meta").innerText(),
    /9:00 am PNG Time/i,
  );
  assert.match(
    await page.locator(".event-hero-meta").innerText(),
    /21 June 2030/,
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Open QA programme" })
      .getAttribute("href"),
    "/qa/programme.pdf",
  );
  assert.match(
    await page
      .getByRole("link", { name: "Chat on WhatsApp" })
      .getAttribute("href"),
    /^https:\/\/wa.me\//,
  );
  await noOverflow(page);
  assert(
    await page
      .locator(".frontier-store h2")
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) > 80),
    "overhaul heading overrides legacy typography",
  );
  await settle(page);
  await page.waitForTimeout(8300);
  assert.equal(
    await page.locator(".v2-hero-position b").innerText(),
    "02",
    "automatic rotation",
  );
  await page.getByRole("button", { name: "Next background" }).click();
  assert.equal(await page.locator(".v2-hero-position b").innerText(), "03");
  await page.waitForTimeout(8300);
  assert.equal(
    await page.locator(".v2-hero-position b").innerText(),
    "03",
    "manual navigation pauses rotation",
  );
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.locator("h1").click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(8300);
  assert.equal(
    await page.locator(".v2-hero-position b").innerText(),
    "04",
    "resumes after interaction",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForTimeout(8300);
  assert.equal(
    await page.locator(".v2-hero-position b").innerText(),
    "04",
    "live reduced-motion change stops rotation",
  );
  assert.equal(
    await page.getByRole("button", { name: /Pause|Resume/ }).count(),
    0,
  );
  await page.getByRole("button", { name: "Next background" }).click();
  assert.equal(
    await page.locator(".v2-hero-position b").innerText(),
    "01",
    "manual navigation available with reduced motion",
  );
  await page.getByRole("button", { name: "View Project", exact: true }).click();
  await page.locator("#presenter-modal-title").waitFor();
  assert.equal(await page.locator(".presenter-modal").isVisible(), true);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".presenter-modal").count(), 0);
  await page.locator(".schedule-compact-trigger").first().click();
  assert.equal(
    await page
      .locator(".schedule-compact-trigger")
      .first()
      .getAttribute("aria-expanded"),
    "true",
  );
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.waitForTimeout(150);
  assert(
    await page
      .locator(".v2-scroll-progress > div")
      .evaluate(
        (el) =>
          Number(
            getComputedStyle(el).transform.split(",")[0].replace("matrix(", ""),
          ) > 0.95,
      ),
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(150);
  await page.screenshot({ path: output + "/desktop.png" });
  await page
    .locator(".frontier-experience")
    .screenshot({ path: output + "/bento.png" });
  await page.locator("#store").screenshot({ path: output + "/store.png" });
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    "PASS desktop rotation, pause/resume, reduced motion, PNG time, presenter modal, schedule, links, scroll progress",
  );

  for (const width of [320, 390, 768, 1024]) {
    const { page, context, errors } = await open({
      width,
      reducedMotion: "reduce",
    });
    await settle(page);
    await noOverflow(page);
    const menu = page.getByRole("button", { name: "Open navigation menu" });
    if (await menu.isVisible()) {
      await menu.click();
      assert.equal(await page.locator("#public-navigation").isVisible(), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#public-navigation").isVisible(), false);
      assert.equal(
        await menu.evaluate((el) => document.activeElement === el),
        true,
      );
      await menu.click();
      await page
        .getByRole("navigation", { name: "Main navigation", exact: true })
        .getByRole("link", { name: /The symposium/ })
        .click();
      assert.equal(await page.locator("#public-navigation").isVisible(), false);
      assert.equal(new URL(page.url()).hash, "#symposium");
      assert(
        await page
          .locator("#symposium")
          .evaluate((el) => el.getBoundingClientRect().top >= 0),
        "anchor target under sticky header",
      );
    }
    if (width === 390) {
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({ path: output + "/mobile.png" });
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log("PASS responsive navigation and layout at " + width + "px");
  }
  for (const options of [
    { data: { ...fixtures, gallery: [] } },
    { galleryFailure: true },
    { brokenImages: true },
    {
      data: {
        ...fixtures,
        event: [{ ...fixtures.event[0], heroImageUrl: "" }],
        gallery: [],
      },
    },
    { data: { ...fixtures, event: [] } },
  ]) {
    const { page, context, errors } = await open(options);
    await settle(page);
    assert.equal(
      await page.locator(".v2-hero-controls").count(),
      options.brokenImages ||
        options.data?.event.length === 0 ||
        options.data?.event[0]?.heroImageUrl === ""
        ? 0
        : 1,
    );
    await noOverflow(page);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "PASS empty gallery, failed gallery, broken images, no images, unpublished event",
  );

  const store = await open({ role: "customer", reducedMotion: "reduce" });
  await store.page.locator(".store-product").waitFor();
  assert.equal(
    await store.page.locator(".store-product").count(),
    1,
    "published products only",
  );
  await store.page.getByRole("button", { name: "Book now" }).click();
  await store.page.getByLabel("Name", { exact: true }).fill("QA Customer");
  await store.page.getByLabel("Phone or email").fill("qa@example.invalid");
  await store.page.getByLabel("Quantity", { exact: true }).fill("2");
  await store.page.getByRole("button", { name: "Request booking" }).click();
  await store.page.getByText("Booking requested.", { exact: false }).waitFor();
  const booking = await store.page.evaluate(
    () => window.__writes.find((w) => w.q.name === "storeOrders").data,
  );
  assert.equal(booking.totalCents, 10000);
  assert.equal(booking.status, "requested");
  assert.equal(booking.ownerId, "qa-user");
  assert.equal(booking.location, null);
  await store.page.evaluate(() => {
    window.__fixtures.announcements[0].title = "Updated without refresh";
    window.__notify("announcements");
  });
  await store.page
    .getByRole("heading", { name: "Updated without refresh" })
    .waitFor();
  await store.context.close();
  for (const [path, role] of [
    ["/superuser", "customer"],
    ["/staff", "staff"],
    ["/superuser", "superuser"],
  ]) {
    const view = await open({ path, role });
    if (role === "customer")
      assert.equal(
        await view.page
          .getByRole("heading", { name: "Access restricted" })
          .isVisible(),
        true,
      );
    else {
      assert.equal(
        await view.page.getByRole("button", { name: /Appearance/ }).count(),
        role === "superuser" ? 1 : 0,
      );
      await view.page.getByRole("button", { name: /Merchandise/ }).click();
      await view.page
        .getByRole("heading", { name: "Merchandise", exact: true })
        .waitFor();
    }
    assert.deepEqual(view.errors, []);
    await view.context.close();
  }
  console.log(
    "PASS customer booking, prices, optional-location default, live updates, staff/superuser screens",
  );

  const admin = await open({ path: "/admin" });
  assert.equal(
    await admin.page.locator(".v2-site, .v2-scroll-progress").count(),
    0,
  );
  assert.equal(await admin.page.locator("#admin-email").isVisible(), true);
  assert.deepEqual(admin.errors, []);
  await admin.context.close();
  console.log(
    "PASS admin login route isolation; no authentication or writes performed",
  );
} finally {
  await browser.close();
}
