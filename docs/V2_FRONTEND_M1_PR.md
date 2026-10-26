# feat: add MCS Symposium V2 frontend milestone 1

Base: `phase-7.1-enhancements`
Head: `feat/v2-frontend-milestone-1`

The public symposium frontend gains rotating hero backgrounds, custom native
scrollbars, scroll progress, heading reveals, and Zentry-inspired typography and
gallery framing. The hero starts with the admin banner and adds up to three
published gallery images, with pause/manual controls and graceful image failures.

The React/TypeScript implementation preserves Firebase content flows, PNG-time
countdown, speaker/project details, schedule, downloads, sponsors, WhatsApp, and
admin routes. It adds keyboard skip/focus behavior and Escape handling, respects
reduced motion, and introduces no application dependencies or backend changes.
Also resolves 12 pre-existing lint failures in event formatting and admin loaders.

Validation:

- `npm ci`: passed.
- `npm run build`: passed (existing >500 kB main-bundle warning remains).
- `npm run lint`: passed.
- `git diff --check`: passed.
- Browser regression results: see `docs/V2_FRONTEND_M1_VALIDATION.md`.

See `docs/V2_FRONTEND_M1.md` for reference mapping, image selection, accessibility,
limitations, and reproducible browser checks. Real Firebase/admin CRUD and a
production-content visual review remain outside the mocked browser check.

No merge into master, deployment, DNS changes, or auto-merge is authorized by this PR.
