import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT, decodeJwt } from "jose";
import {
  handleReceipt,
  handleAnalytics,
  validReceipt,
} from "../worker/receipts.ts";
import { bookingTotal } from "../src/v2/storeModel.ts";
const { publicKey, privateKey } = await generateKeyPair("RS256");
const jwk = {
  ...(await exportJWK(publicKey)),
  kid: "test-key",
  alg: "RS256",
  use: "sig",
};
const project = "demo-mcs-v2";
const token = async (uid) =>
  new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setSubject(uid)
    .setIssuer(`https://securetoken.google.com/${project}`)
    .setAudience(project)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
const tokens = Object.fromEntries(
  await Promise.all(
    ["buyer", "other", "staff", "owner", "suspended"].map(async (uid) => [
      uid,
      await token(uid),
    ]),
  ),
);
let order = {
  ownerId: { stringValue: "buyer" },
  status: { stringValue: "confirmed" },
  receiptPath: { stringValue: "" },
};
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.includes("googleapis.com/service_accounts"))
    return Response.json({ keys: [jwk] });
  const uid = decodeJwt(
    (init?.headers?.Authorization || "").replace("Bearer ", ""),
  ).sub;
  if (url.includes("/storeOrders/")) return Response.json({ fields: order });
  if (url.includes("/users/"))
    return Response.json({
      fields: {
        role: {
          stringValue:
            uid === "owner"
              ? "superuser"
              : uid === "staff" || uid === "suspended"
                ? "staff"
                : "customer",
        },
        active: { booleanValue: uid !== "suspended" },
      },
    });
  throw Error("Unexpected external request: " + url);
};
const objects = new Map();
const env = {
  FIREBASE_PROJECT_ID: project,
  PRIVATE_RECEIPTS: {
    put: async (path, stream, metadata) => {
      objects.set(path, {
        data: await new Response(stream).arrayBuffer(),
        metadata,
      });
    },
    get: async (path) =>
      objects.has(path)
        ? {
            body: objects.get(path).data,
            httpMetadata: objects.get(path).metadata.httpMetadata,
          }
        : null,
  },
};
function request(uid, method = "GET", file = null) {
  let body;
  if (file) {
    body = new FormData();
    body.append("file", file);
  }
  return new Request("https://test.invalid/api/receipts/booking", {
    method,
    headers: uid ? { Authorization: `Bearer ${tokens[uid]}` } : {},
    body,
  });
}
try {
  assert.equal(bookingTotal(5000, 2), 10000);
  for (const qty of [0, -1, 26, 1.5, NaN])
    assert.throws(() => bookingTotal(5000, qty));
  assert.equal(
    (await handleReceipt(request(null), env, "booking")).status,
    401,
  );
  assert.equal(
    (await handleReceipt(request("other"), env, "booking")).status,
    403,
  );
  assert.equal(
    (await handleReceipt(request("suspended"), env, "booking")).status,
    403,
  );
  assert.equal(
    (await handleReceipt(request("buyer"), env, "../booking")).status,
    400,
  );
  assert.equal(
    await validReceipt(
      new File(["fake"], "proof.pdf", { type: "application/pdf" }),
    ),
    false,
  );
  assert.equal(
    await validReceipt(
      new File(["<svg/>"], "proof.png", { type: "image/png" }),
    ),
    false,
  );
  const pdf = new File(["%PDF-1.4\nQA receipt"], "proof.pdf", {
    type: "application/pdf",
  });
  assert.equal(
    (await handleReceipt(request("staff", "POST", pdf), env, "booking")).status,
    403,
  );
  order.status.stringValue = "requested";
  assert.equal(
    (await handleReceipt(request("buyer", "POST", pdf), env, "booking")).status,
    409,
  );
  order.status.stringValue = "confirmed";
  const upload = await handleReceipt(
    request("buyer", "POST", pdf),
    env,
    "booking",
  );
  assert.equal(upload.status, 201);
  const { path } = await upload.json();
  assert.match(path, /^receipts\/buyer\/booking\/[a-f0-9-]{36}$/);
  assert.equal(
    order.status.stringValue,
    "confirmed",
    "upload must not automatically mark paid or change order",
  );
  order.receiptPath.stringValue = path;
  for (const uid of ["buyer", "staff", "owner"]) {
    const response = await handleReceipt(request(uid), env, "booking");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.match(response.headers.get("content-disposition"), /^attachment;/);
  }
  order.receiptPath.stringValue =
    "receipts/other/booking/11111111-1111-4111-8111-111111111111";
  assert.equal(
    (await handleReceipt(request("buyer"), env, "booking")).status,
    404,
  );
  assert.equal((await handleAnalytics(request("staff"), env)).status, 403);
  assert.equal(
    (await handleAnalytics(request("owner"), env)).status,
    503,
    "unconfigured analytics must not invent metrics",
  );
  console.log(
    "PASS private receipt API: token verification, owner/staff access, suspension, traversal, MIME signatures, booking confirmation, private cache headers, forged paths, analytics access and booking arithmetic.",
  );
} finally {
  globalThis.fetch = originalFetch;
}
