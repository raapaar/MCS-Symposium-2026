# V2 experience and store update

Development branch: `feat/v2-experience-and-store`, based on graphical overhaul `f4772fa`.
No merge, deployment, Auth setting, production record, bucket or live rule change was performed.

## Implemented

- Equal-size portrait poster cards for keynote, guest and student presenters. Keynotes use yellow, guests turquoise and students lavender. Long headings/names are bounded; full text remains in the landscape detail dialog. All categories open with an enlargement animation. Native modal focus/keyboard behavior, Escape dismissal, LinkedIn links, biography/project text, project logo and screenshots are included. Presenter editor supports project logo upload/URL.
- Countdown disappears at the start timestamp, with no underway text or replacement countdown.
- Homepage merchandise is a three-item showcase. Dedicated `/store`, `/store/login`, `/store/cart`, `/store/checkout`, `/store/orders` and `/store/policies` pages support account creation/sign-in, categories, a persistent cart, quantity/removal, checkout and private proof submission. Cart has at most ten distinct items to keep atomic checkout within Firestore security-rule document-access limits. Every price is checked against the current published product when creating the booking.
- Reservation expiry derives from trusted `createdAt + 24 hours`. Unpaid requested/confirmed/rejected orders become effectively expired at the deadline. UI labels them expired; Firestore rules and the receipt Worker prevent late confirmation/fulfilment or proof submission. No scheduler or status-writing client is necessary. Timely proof submissions remain awaiting staff review after the deadline. Rejected proofs must be resubmitted within the original window. These are time-limited booking requests; no stock-quantity decrement or automatic inventory allocation has been added.
- Gallery advances every two seconds, with pause/play, previous/next and an expandable thumbnail navigator. It pauses on interaction, when navigation is open, and under reduced motion. Selecting an image pauses playback.
- Programme cards slide horizontally and open detailed segment dialogs. Compact timeline follows explicit `startsAt`/`endsAt` in PNG time (UTC+10), retaining the old per-item status when automatic timing is not configured. Concurrent items are displayed separately. Schedule staff can override the active segment (before event, 1–4, event complete), skip forward, resume automatic timing or edit individual start/end times.
- Let's Talk is a local source-matching enquiry guide using live published event details, programme, presenters, announcements, merchandise, documents, sponsors and staff-maintained FAQ entries. It links answers to the source and acknowledges missing information. Questions stay in the browser; they are not sent to an external AI provider or saved. This is a bounded retrieval assistant, not an unrestricted generative model or a claim that every possible question is understood.
- Footer follows the supplied black, spacious, divided-column reference, using symposium/store/information/enquiry links. Its upper area links to announcements; no newsletter subscription service or invented social accounts are connected.
- Staff workspace has separate editor tabs. An explicit `users/{uid}.permissions` list determines assigned sections for staff. Direct routes, Firestore writes and Worker image uploads/deletes enforce those permissions. Legacy admin and superuser retain full section access. Ordinary staff with no assigned permissions receive no section privileges. Finance approval (`payments`) is required to mark proof paid or rejected. Superuser account creation/editing can assign/revoke section privileges. Own role/permission changes and superuser creation remain blocked.
- Hero, feature/bento artwork, DWU/MCS header/footer logos are replaceable in Appearance via upload or URL. Existing event/HOD/presenter/staff/gallery/sponsor/product managers retain image editing. Event hero image is now the initial image unless the Appearance override is set. Local media URLs returned by the Worker are accepted by the new image settings.

## Checks performed

- Production build, repository lint and Worker TypeScript check.
- `node tests/experience-v2.mjs`: PNG-time boundaries, manual timeline override, exact 24-hour expiry, preservation of timely pending proofs, enquiry source matching.
- `node tests/receipts-v2.mjs`: existing receipt tests plus expiry and content-staff denial.
- Firestore emulator rules compile and positive/negative tests pass, including section isolation, self-escalation denial, finance-only verification, expired proof rejection, invalid privileges and uploaded-branding paths.
- Cloud Chromium with the explicitly offline `dev:qa` configuration: six cards measured at equal 299×540 dimensions, project landscape dialog with logo/screenshot/LinkedIn, Escape and focus return, gallery rotation/navigation/selection, schedule detail dialog, enquiry answer/source links, homepage showcase, dedicated store/cart persistence/checkout sign-in gate, gallery-only staff tabs, direct presenter-route denial, superuser tabs and upload controls.
- Fixture code is excluded from the production bundle. No actual sign-in, booking, payment, upload or external write was made through browser QA. Mobile sizing is implemented in CSS, but no mobile browser/device run was performed in this session.

## Release configuration and acceptance

Use a non-production Firebase/Worker environment for real Auth, checkout, roles, R2 receipts and image upload testing before release. Existing live rules do not yet know about the new permissions/settings/FAQ paths. Do not deploy this frontend against production and assume the new backend features are ready.

1. Review existing staff accounts. Through an authorized superuser process, assign each staff record only the required section permissions. `orders` handles bookings, `payments` handles financial verification. Do not blindly promote staff or automatically convert them to admin. Review legacy admins because they retain broad access.
2. Review/apply Firestore rules and Worker changes together after release approval. Private receipts still require the separate private R2 bucket binding from the previous milestone. Public media uses the existing Worker route. Vite alone does not run the Worker API.
3. Keep existing Firebase client configuration and enable customer email/password sign-in only through the approved account setup process. No credentials are included in the package.
4. Set programme start/end dates and times explicitly in PNG time. Check the timeline with realistic concurrent sessions and staff overrides.
5. Add confirmed FAQ content. Broader natural-language AI requires a separately configured provider/server integration; this build does not invent answers or require an API key for its source-based guide.
6. Bank-transfer instructions and proof upload are the available payment path. Card payment requires the department's chosen approved gateway and credentials; no card gateway or banking credentials are collected here.
7. Expiry limits the booking window; it does not reserve stock quantities. Expired orders remain in the audit trail. Staff must confirm item availability before a customer pays.
8. Clear obsolete personal contact details from published event records if no longer intended to be public. The new public UI no longer shows those fields, but existing stored values are not silently deleted.
9. Reconcile the dependency updates already made on the Windows PC. This patch does not replace the lockfile or downgrade Firebase. The prior audit findings and large bundle warning remain release considerations.
10. Complete actual-content, mobile, accessibility and staff acceptance testing. Handover and ownership controls from the prior milestone remain restricted.

I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for section-assigned editing, owner-only bookings and receipt submission, reservation expiry and finance-only payment approval. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.

## Offline QA

`npm run dev:qa` explicitly substitutes synthetic Firebase records and disables all writes/sign-in. Only use it for interface review. Optional `?qaRole=staff` and `?qaRole=superuser` select mock roles in that offline configuration; these query parameters do nothing under normal development or production. `npm run dev` uses the actual Firebase configuration and normal access controls.

Rules test command (Java 17, Node, demo project only):

```sh
npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-mcs-v2 --config firebase.emulator.json "node tests/firestore-v2.mjs"
```
