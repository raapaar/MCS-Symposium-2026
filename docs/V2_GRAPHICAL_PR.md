# feat: rebuild MCS V2 graphical experience and add merchandise workflows

Target: `phase-7.1-enhancements`
Head: `feat/v2-graphical-overhaul`

Replace the restrained V2 milestone with an immersive graphical frontend based on
the supplied Image-BG-Rotation, Scrollbar.app and Zentry concepts. Add original
hero artwork, animated navigation, large typography, bento sections, parallax,
live updates and a completely new store and contact presentation, preserving
existing symposium content and management workflows.

Add the merchandise booking workflow, customer history, private receipt API,
staff confirmation/payment verification, and separate staff/superuser workspaces.
Superuser tools cover appearance, staff accounts, statistics, domain/services and
departmental handover records. New Firestore rules enforce booking prices,
ownership and status transitions; receipt bytes use a separate private R2 binding.

Validation: build, lint, Worker typecheck, receipt API tests, Firestore emulator
rules tests and responsive Chromium regression checks passed. See
`docs/V2_GRAPHICAL_OVERHAUL.md` and `docs/V2_RULES_REVIEW.md` for evidence and limits.

Release remains blocked on actual-service integration testing, private receipt
bucket configuration, approved superuser bootstrap and security/dependency review.
Four high production dependency audit findings and the existing main-bundle-size
warning remain. No production configuration, data, merge or deployment was changed.
