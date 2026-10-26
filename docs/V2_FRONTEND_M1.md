# MCS Symposium V2.0 — frontend milestone 1

Development branch: `feat/v2-frontend-milestone-1`
Base: `phase-7.1-enhancements` at `2ceabb991754a52df51d7b477d217117344ed886`

## Result

The public React/TypeScript site gains a cinematic crimson hero, rotating backgrounds,
custom native scrollbars, a reading progress indicator, section heading reveals, and a
featured gallery layout. Existing Firebase content, public section order, admin
routes, uploads, downloads, countdown, speaker/project details, schedule, sponsors,
and WhatsApp enquiry flow remain connected to their original implementations.

This first milestone interprets the three requested references as the following
frontend concepts. It does not copy their source, assets, branding, or content.

| Reference | Adaptation |
| --- | --- |
| [Image-BG-Rotation](https://github.com/StudioApartment/Image-BG-Rotation) | Responsive image sequence, left-aligned fixed copy, and current-image indicator. Uses six-second rotation with manual navigation and pause rather than the reference's three-second interval. |
| [Scrollbar.app](https://github.com/henripar/scrollbar) | Crimson thumb, pale track, rounded native scrollbar, using both standard CSS and WebKit fallback. Native wheel, touch, keyboard, anchors, and browser scroll remain intact. |
| [Zentry](https://github.com/abuzar-alvi/Zentry-Animated-Gaming-Landing-Page) | Large editorial hero typography, layered geometric framing, warm accent, heading reveals, and an asymmetric gallery. Keeps the symposium's academic identity and existing crimson theme. |

## Hero content contract

- The existing published event's `heroImageUrl` remains the first background.
- Up to three **published** gallery documents are read through a bounded query;
  their existing `image` and `title` fields provide additional backgrounds.
  Selection uses Firestore's default document order, without a new composite index.
- No new event fields, Firestore indexes/rules, upload workflow, or admin form fields
  are needed. Unpublished gallery records are never requested as public slides.
- Duplicate and empty URLs are removed. Failed images are removed from the sequence.
  An unavailable gallery leaves the existing banner; no images leaves the crimson
  background and readable event content.
- Controls appear only for multiple usable images. Manual next/previous pauses
  rotation until Resume. Hover or focus on controls, a hidden browser document,
  or an offscreen hero suspends automatic rotation.
- Reduced-motion preferences, including a live preference change, disable autoplay,
  crossfades, reveals, and smooth scrolling. Manual background navigation remains.
- Hero copy, event date, countdown, and calls to action do not change when slides do.

## Preservation and accessibility

The admin branch of `App.tsx` remains unchanged. New CSS is scoped to `.v2-site`
(or the document containing it); admin screens do not acquire the public shell.
Both university and MCS logos are retained. No real identities, schedules, or
production records are invented. The countdown still uses PNG UTC+10.

The public shell adds a keyboard skip link, visible focus styles, a real `#home`
target, and `aria-controls` for the mobile menu. Escape closes the menu and returns
focus to its toggle. Reveal effects attach only when IntersectionObserver is
available and clean up when motion preferences change. Asynchronous Firebase
headings are observed as they arrive. Content remains visible without the observer.
The progress indicator is decorative and uses one scheduled frame per scroll update,
with resize observation for content loaded later.

Twelve lint failures already present on the base were corrected without disabling
rules: event memo dependencies now match the event value; seven manager initial
loads are deferred through cancellable tasks, preserving their existing reload
feedback; the non-editable event id is explicitly discarded; and an unused storage
implementation parameter is removed (the shared upload interface is unchanged).

## Validation

Run the normal locked dependency installation and checks:

```sh
npm ci
npm run build
npm run lint
git diff --check
```

Optional browser regression check:

1. Make the `playwright` npm package and its Chromium browser available in the
   test environment. This optional tool is not added to application dependencies.
2. Start `npm run dev` in one terminal.
3. Run `node scripts/check-v2-frontend.mjs` in another terminal.
   `PLAYWRIGHT_MODULE` may identify an existing Playwright module;
   `CHROMIUM_PATH` may identify an existing Chromium executable.
   `TEST_ORIGIN` defaults to `http://127.0.0.1:5173` and `TEST_OUTPUT` to
   `/tmp/mcs-v2-check` (override it on Windows).

The browser harness stubs Firebase modules and all fixture images, aborts external
requests, and checks the actual React components. Synthetic QA data never enters
application source content or Firebase. It checks rotation, pause/resume, reduced
motion, PNG date/time across a foreign browser timezone, presenter modal, schedule
accordion, download/WhatsApp links, scroll progress, 320/390/768/1024px layouts,
mobile Escape and anchor behavior, image/gallery fallbacks, and admin login shell
isolation. Screenshots are diagnostic fixture views, not official event previews.
It does not validate real Firebase credentials, admin CRUD, or production hosting.

The existing main-bundle warning over 500 kB remains; no extra runtime animation
library or application dependency was added. Browser-specific scrollbar appearance
is intentionally left to browser/platform support. Cross-browser and live-content
review are required before release.

## Review and release boundary

Open a pull request **into `phase-7.1-enhancements`**, not `master`.
Do not enable auto-merge, merge branches, publish a preview to a hosting provider,
change DNS, or deploy without the owner's approval.
