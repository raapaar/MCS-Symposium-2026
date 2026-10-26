# V2 graphical overhaul — review build

Branch: `feat/v2-graphical-overhaul`, based on the previous frontend milestone.
This replaces the restrained first milestone's presentation. The existing site
supplies its information, content managers and core workflows; its styling is
superseded inside the new public shell.

## Requested scope and implementation

| Requirement recovered from the other MCS chat | Implementation |
| --- | --- |
| Full graphical overhaul matching the references | Original cinematic mathematical landscape; oversized editorial type; black, lavender and electric accent surfaces; floating-style navigation; animated full-screen menu; bento cards and parallax. |
| Image-BG-Rotation | Original artwork plus existing admin banner and published gallery; previous/next/pause; configurable 6–30 second rotation. |
| Scrollbar.app | Native custom scrollbar with standard and WebKit styles; native wheel/touch/keyboard scrolling. |
| Zentry | Immersive hero, oversized background word, layered imagery, scroll reveals, pointer tilt, asymmetric feature cards, graphic store and contact sections. |
| Preserve original information and functionality | Firebase event/about/HOD, keynote/presenter distinction, project modal, staff, schedule, announcements, sponsors, gallery, documents, contacts and existing managers remain. Contact now follows documents. |
| Store advertisements and bookings/orders | Live published merchandise catalogue, categories, availability, PGK prices, customer sign-in/registration, bookings, staff confirmation, customer booking history. |
| Payment-proof uploads and staff verification | Customers submit a JPEG/PNG/PDF only after confirmation; private authenticated upload/download; receipt submissions become awaiting verification. Staff review against bank records before marking paid. No automatic payment success. |
| Optional location permission | Requested only through the customer's explicit button; denial or unsupported geolocation does not block a booking; attached location can be removed. |
| Live changes without refresh | Firestore subscriptions for announcements, featured updates, programme, merchandise, bookings, role changes and appearance. |
| Simplified staff workspace | `/staff` or the existing `/admin/dashboard` groups content tasks, merchandise editing, bookings and receipt review. Existing edit screens retain their functionality under a new skin. |
| Separate superuser workspace | `/superuser` requires the superuser role; adds appearance, staff-account provisioning/suspension, statistics, service/domain and handover registers. |
| Configurable images/colors/layout/animation | Superuser appearance editor controls accent, light surface, hero image, oversized word, compact/spacious spacing, rotation interval, gallery use and motion. Reduced-motion preference wins. |
| Statistics/visits | Live booking/product/verified-payment totals; optional server-side Cloudflare seven-day request/visit/transfer metrics. Unconfigured traffic metrics show unavailable, not invented numbers. |
| Domain/services/credentials ownership | Superuser register stores provider, custodian, renewal date, notes and secure-vault references. Passwords/API keys belong in a private vault, not Firestore. |
| Department-authorized handover | Separate restricted handover register. Creating a handover record does not grant ownership or silently promote an account. |

The store is a booking and manually verified bank-payment workflow. It does not
charge cards, integrate an online payment gateway, or automatically reserve stock.
A submitted booking is a request until staff confirms availability.
No merchandise, real people, prices, bank instructions or statistics are invented
in production. Test fixtures are confined to regression scripts.

## Routes and roles

| Role | Access |
| --- | --- |
| Public | Published content and merchandise; public visual settings. |
| Signed-in customer | Their own bookings and private receipts. |
| Staff | Content editing, merchandise, all bookings and payment-proof review. |
| Legacy `admin` | Retains existing administrative content access; treated as staff for V2. |
| `superuser` | Staff capabilities plus appearance, account provisioning/access, statistics and private ownership registers. |

Enforcement exists in route guards, Firestore rules and the Worker. Hiding a menu
is not the authorization boundary. Suspended roles cannot use protected APIs.
Existing content rules retain their schemas; new domains have bounded validators,
field allowlists, immutable ownership/pricing and explicit status transitions.

## Validation performed

- Production build and repository lint passed.
- Worker TypeScript check passed: `npx tsc -p tsconfig.worker.json`.
- Receipt API tests passed: `node tests/receipts-v2.mjs`.
- Firestore emulator tests passed, including syntax compilation and negative cases:
  `npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-mcs-v2 --config firebase.emulator.json "node tests/firestore-v2.mjs"`.
- Browser tests passed with Chromium: hero rotation, pause/resume, live
  reduced-motion changes, old project/schedule flows, PNG time, links,
  320/390/768/1024px layouts, menu Escape/focus, missing images/data, customer booking
  arithmetic, live announcements and separate role screens.
- Original desktop/mobile and section screenshots were inspected using synthetic
  content. Browser checks use mocked Firebase responses; no production records,
  logins or uploads are made.
- The binary patch is checked against the previous milestone's clean tree.

The browser check is `scripts/check-v2-overhaul.mjs` (the original test command now
forwards to it). Start `npm run dev`, then run it with Playwright available.
`PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, `TEST_ORIGIN` and `TEST_OUTPUT` can override
local tool paths. This optional browser tooling is not bundled as an app dependency.
The Firestore emulator command uses a demo project; Java 17 works with the pinned
emulator CLI. The CLI is test tooling and is not a deployment recommendation.

## Release configuration still required

No production Firebase/Cloudflare settings or records were changed.

1. Review the prototype rules and the receipt workflow; test them against a
   non-production Firebase project using actual Auth and R2 before release.
2. Keep the existing Firebase project/default-database configuration. Remote
   database edition could not be verified from this environment; no database
   provisioning, switching or migration was attempted.
3. Under the department's approved process, bootstrap the initial superuser role
   in `users/{uid}` through a controlled administrator process. Existing admin
   users are not silently elevated. Ensure staff records are correct.
4. Provision `mcs-symposium-2026-receipts` and connect `PRIVATE_RECEIPTS` as a
   **private** R2 bucket. Do not enable r2.dev or a public custom domain for receipts.
   The existing media bucket remains for public content; receipts never use it.
5. Review/apply the new Firestore rules and Worker together only after release
   approval. Until then, local Vite can show the graphical site using the existing
   Firebase configuration, but new store collections can be denied by old rules.
   Vite alone does not run the private receipt API; it requires the Worker.
6. Ensure customer email/password sign-in is enabled in the authorized Firebase
   environment and hostnames are allowed. No Auth provider was changed here.
7. Optionally configure Worker-only `ANALYTICS_ZONE_ID` and a restricted
   `ANALYTICS_API_TOKEN`; do not put secrets in Vite variables or Firestore.
8. Resolve the existing dependency audit findings before release. `npm audit
   --omit=dev` reported **four high** findings in the existing Firebase/gRPC tree.
   The automated recommendation proposes a major downgrade; it was not applied.
   The existing >500 kB main-bundle warning also remains.
9. Run actual-content, cross-browser, accessibility and staff acceptance review.
   The mock browser suite does not establish real service integration readiness.

I've set up prototype Security Rules to keep the data in Firestore safe. They are
designed to be secure for owner-scoped bookings, staff payment verification and
superuser-only ownership controls. However, you should review and verify them
before broadly sharing your app. If you'd like, I can help you harden these rules.

## Original art and references

The original hero is `src/assets/v2-frontier.webp` (approximately 289 kB). It was
created with the built-in image-generation tool and compressed to WebP for the
site. Prompt: panoramic cinematic mathematical landscape with a floating dark
metal Möbius torus, lavender energy, an acid-yellow geometric core, volcanic
terraces and distant mountains; dark open left sky for typography; no people,
text, logos, interface or existing game IP. The full prompt is preserved in
`V2_GRAPHICAL_ART_PROMPT.md`.

Reference concepts were studied from:

- https://github.com/StudioApartment/Image-BG-Rotation
- https://github.com/henripar/scrollbar
- https://github.com/abuzar-alvi/Zentry-Animated-Gaming-Landing-Page

The implementation is original React/TypeScript/CSS, with no borrowed game assets,
reference-site fonts, audio or video payloads. The original content managers and
backend architecture remain part of this repository.

## Publication boundary

The GitHub connection previously returned HTTP 403 for branch creation. This work
is committed locally and supplied as a binary patch with a prepared PR description.
Open the PR into `phase-7.1-enhancements`. No merge into master, auto-merge,
deployment, DNS change, bucket provisioning, Auth change or live rules change has
been performed. Each release action still needs the owner's approval.
