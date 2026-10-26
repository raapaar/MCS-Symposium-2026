# V2 frontend milestone 1 — validation record

Validated 27 October 2026 (Papua New Guinea time).

| Check | Result |
| --- | --- |
| Locked dependency installation (`npm ci --ignore-scripts`) | Passed, 278 packages installed; package files unchanged. |
| Production build (`npm run build`) | Passed, including TypeScript. |
| Repository lint (`npm run lint`) | Passed, zero errors/warnings. |
| Whitespace check (`git diff --check`) | Passed. |
| Browser rotation and pause/resume | Passed. |
| Live reduced-motion change; manual navigation under reduced motion | Passed. |
| PNG date/time in America/New_York browser timezone | Passed. |
| Presenter modal open/Escape close and schedule accordion | Passed. |
| Existing document and WhatsApp link destinations | Passed. |
| Scroll progress with content loaded asynchronously | Passed. |
| 320, 390, 768, 1024px horizontal overflow and navigation | Passed. |
| Mobile menu Escape/focus return, About anchor, and close on link selection | Passed. |
| Empty/failed gallery, all broken images, no configured images, and no published event | Passed. |
| Admin login route and public-shell isolation | Passed. |
| Desktop/mobile fixture screenshot inspection | Passed. |

Browser checks used Chromium headless shell 134 with Playwright and synthetic
Firebase responses. Every external browser request was blocked by the harness.
No production data, login, upload, or mutation was used. This is not an end-to-end
verification of Firebase credentials, admin CRUD, or hosting.

The base build already emitted a >500 kB main JavaScript chunk warning; it remains.
No application dependency or package-lock change was introduced. Other browser
engines and official content still need review before a release.

## Publication status

The implementation is committed locally on `feat/v2-frontend-milestone-1`, directly
based on `2ceabb991754a52df51d7b477d217117344ed886` from
`phase-7.1-enhancements`.

The connected GitHub integration rejected branch creation with HTTP 403,
`Resource not accessible by integration`. A native Git push dry-run also lacked
credentials. The remote development branch and PR therefore have not been created.
`docs/V2_FRONTEND_M1_PR.md` supplies the ready PR title/body, targeting
`phase-7.1-enhancements`. No master merge, deployment, or DNS change was performed.
