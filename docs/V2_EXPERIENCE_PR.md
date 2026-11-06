# feat: add symposium poster details, live programme and dedicated store

Target: phase-7.1-enhancements
Head: feat/v2-experience-and-store

Replace speaker/project listings with uniform poster cards and animated landscape details. Hide the expired countdown. Add a two-second gallery with thumbnail navigation, slidable programme cards and a timeline with PNG-time automation and staff overrides. Move shopping into dedicated catalogue/account/cart/checkout/booking pages and enforce a 24-hour booking window.

Replace public personal-contact links with a published-content enquiry guide and rebuild the footer. Separate staff editors into assigned-section tabs; enforce permissions on routes, Firestore writes and Worker media actions, with finance-only payment verification. Make hero/bento/branding images editable and add student project-logo uploads.

Validation: build, lint, Worker typecheck, domain logic tests, private receipt API tests, Firestore emulator rules tests and desktop Chromium fixture checks passed. See docs/V2_EXPERIENCE_AND_STORE.md for exact scope, test limits, migration and release setup.

No production settings/data, merge or deployment changed. Real Auth/R2 acceptance testing, mobile review and prior dependency audit findings remain. Payment uses bank instructions/manual proof verification; no card gateway is connected. Enquiry replies match published sources; no external generative AI service is connected. Reservation expiry does not allocate stock quantities.
