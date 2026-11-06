import assert from "node:assert/strict";
import { validateV2Environment, projectId } from "../scripts/v2-env.mjs";
const fixture = {
  VITE_FIREBASE_PROJECT_ID: projectId,
  VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
  VITE_FIREBASE_STORAGE_BUCKET: `${projectId}.firebasestorage.app`,
  VITE_FIREBASE_MESSAGING_SENDER_ID: "689947459888",
  VITE_FIREBASE_API_KEY: `AIza${"x".repeat(35)}`,
  VITE_FIREBASE_APP_ID: "1:689947459888:web:0123456789abcdef012345",
};
assert.doesNotThrow(() => validateV2Environment(fixture));
for (const key of Object.keys(fixture))
  assert.throws(() => validateV2Environment({ ...fixture, [key]: "" }), key);
assert.throws(() =>
  validateV2Environment({
    ...fixture,
    VITE_FIREBASE_PROJECT_ID: "mcs-symposium-2026",
  }),
);
assert.throws(() =>
  validateV2Environment({
    ...fixture,
    VITE_FIREBASE_API_KEY: "COPY_FROM_FIREBASE",
  }),
);
console.log(
  "PASS: missing fields, V1/cross-project settings and placeholder keys fail closed.",
);
