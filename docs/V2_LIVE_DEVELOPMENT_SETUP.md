# Isolated V2 live development configuration

This follow-up config targets the Firebase project supplied by the owner:
`mcs-symposium-v2-development` (project number `689947459888`).

It does not change the existing `wrangler.jsonc`, default Vite build, V1 Worker,
master branch, database, buckets, domains or authentication. No remote provisioning
or deployment has been performed.

## Files and commands

- `wrangler.v2-dev.jsonc`: Worker `mcs-symposium-v2-dev`; new R2 media and receipt bucket names; assets in `dist-v2`.
- `.env.v2.example`: public Firebase web configuration template. Copy to `.env.v2.local`, which is ignored by Git. Fill apiKey and appId by copying text from Firebase's SDK configuration. No screenshot transcription is used for these values.
- `npm run dev:v2`: normal app with real V2 Firebase configuration, not synthetic fixtures.
- `npm run build:v2`: validates environment values, runs TypeScript, and builds with Vite mode `v2` into `dist-v2`.
- `npm run deploy:v2`: rebuilds with the guard, then deploys with the separate V2 Wrangler file. Do not run until the resources and access below are ready.

The environment check rejects V1's project ID, missing variables, mismatched
project-domain/bucket/sender values, and placeholder API keys/app IDs. It checks
configuration consistency, not actual API permissions or provider readiness.

## Local configuration

The existing Firebase package is already installed. No new dependency is needed.

PowerShell, inside C:\Users\ID240175\MCS-Symposium-2026:

```powershell
Copy-Item .env.v2.example .env.v2.local
notepad .env.v2.local
```

Fill the two COPY placeholders using Firebase's copy button for the exact web
`apiKey` and `appId`. Verify all six fields match the NEW project. Keep the existing
V1 .env settings unchanged. Never put service-account private keys in VITE_ fields.

Then run:

```powershell
node tests/v2-env.mjs
npm run build:v2
npm run lint
```

## Firebase provisioning still required

In the new project only:

1. Enable Authentication with Email/Password and configure the intended authorized
   hostnames (including dev.mcssymposium.site when connected and the actual
   workers.dev hostname if used for testing).
2. Create the default Cloud Firestore database. Choose its edition/location after
   reviewing the available options; this code uses the Firebase Web SDK and the
   Worker accesses the `(default)` database. Do not provision a named database
   without matching code changes.
3. Apply the reviewed repository `firestore.rules` to this project. Do not leave
   broad test-mode access enabled. Bootstrap the initial superuser through the
   owner-controlled process; new V2 Auth accounts have different UIDs from V1.
4. Seed only the required public event content. Do not silently copy V1 accounts,
   receipts or personal data to development. Existing source archives do not back
   up Firestore or R2 data.

## Cloudflare provisioning still required

Create separate buckets:

- `mcs-symposium-v2-dev-media` for public event media through the Worker API.
- `mcs-symposium-v2-dev-receipts` for private payment proofs. Do not enable public
  r2.dev access or a public custom domain on the receipt bucket.

Create/connect a separate Worker named `mcs-symposium-v2-dev` to repository
`raapaar/MCS-Symposium-2026`, branch `feat/v2-experience-and-store`, with:

- Build command: `npm run build:v2`
- Deploy command: `npx wrangler deploy --config wrangler.v2-dev.jsonc`
- Root directory: repository root
- Build variables: all six VITE_FIREBASE_* values from `.env.v2.local`

Do not change the current V1 Worker's production branch from master. This V2
Wrangler config repeats the required bindings explicitly and targets only the
new buckets. The binding identifier `mcs_symposium_2026_media` is retained because
existing Worker code reads that identifier; its BUCKET is the new V2 bucket.

The first Cloudflare deployment may fail until all buckets, build variables and
account permissions exist. Do not substitute V1 bucket bindings to work around it.

Verify the returned V2 workers.dev URL and real V2 sign-in, publishing, image
uploads, cart/booking/proof workflows, staff permissions and live schedule. Then
add `dev.mcssymposium.site` as a custom domain on the V2 Worker and update V2 Auth
hostnames. A separate address alone does not isolate a Firebase database.

No custom-domain route is embedded yet; attaching it is a separate step after the
new Worker has been verified. Avoid exposing real banking/personal/test payment
data on the public development site.

## Validation

- Environment guard unit tests passed, including V1/missing/placeholder rejection.
- V2 build and TypeScript passed using explicitly synthetic client configuration.
- Repository lint passed.
- Wrangler deploy --dry-run --config wrangler.v2-dev.jsonc passed and listed only
  the V2 project and new bucket names. Dry run does not create resources, verify
  real credentials or establish that Firebase services are configured.
- No actual Firebase connection, remote write or Cloudflare deployment was tested.

Current guides:
https://vite.dev/guide/env-and-mode
https://developers.cloudflare.com/workers/wrangler/environments/
