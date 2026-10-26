import { getFirebaseRole, verifyFirebaseToken } from "./auth.ts";
import type { Env } from "./index";

const maximumBody = 6 * 1024 * 1024;
const maximumFile = 5 * 1024 * 1024;
const privateHeaders = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  Vary: "Authorization",
};
const fail = (error: string, status: number) =>
  Response.json({ error }, { status, headers: privateHeaders });

async function boundedForm(request: Request): Promise<FormData> {
  if (
    Number(request.headers.get("content-length")) > maximumBody ||
    !request.body
  )
    throw Error("size");
  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBody) {
        await reader.cancel();
        throw Error("size");
      }
      chunks.push(value.slice());
    }
  } finally {
    reader.releaseLock();
  }
  return new Response(new Blob(chunks), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
}
export async function validReceipt(file: File): Promise<boolean> {
  if (!file.size || file.size > maximumFile) return false;
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (file.type === "image/jpeg")
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (file.type === "image/png")
    return [137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n);
  if (file.type === "application/pdf")
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  return false;
}
export async function handleReceipt(
  request: Request,
  env: Env,
  id: string,
): Promise<Response> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return fail("Invalid booking.", 400);
  const token = request.headers
    .get("Authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return fail("Sign in to access payment proof.", 401);
  try {
    const user = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/storeOrders/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      return fail(
        "Booking unavailable or access denied.",
        response.status === 404 ? 404 : 403,
      );
    const data = (await response.json()) as {
      fields?: Record<string, { stringValue?: string }>;
    };
    const ownerId = data.fields?.ownerId?.stringValue;
    const status = data.fields?.status?.stringValue;
    const own = ownerId === user.sub;
    const role = own
      ? "customer"
      : await getFirebaseRole(token, env.FIREBASE_PROJECT_ID, user.sub!);
    if (!own && !["staff", "admin", "superuser"].includes(role))
      return fail("Access denied.", 403);
    if (!env.PRIVATE_RECEIPTS)
      return fail("Private receipt storage is not configured.", 503);
    if (request.method === "POST") {
      if (!own)
        return fail("Only the customer can submit their payment proof.", 403);
      if (!["confirmed", "rejected"].includes(status || ""))
        return fail(
          "Wait for staff confirmation before submitting proof.",
          409,
        );
      let form: FormData;
      try {
        form = await boundedForm(request);
      } catch {
        return fail("Choose a receipt smaller than 5 MB.", 413);
      }
      const file = form.get("file");
      if (!(file instanceof File) || !(await validReceipt(file)))
        return fail(
          "Payment proof must be a valid JPEG, PNG, or PDF under 5 MB.",
          400,
        );
      const path = `receipts/${user.sub}/${id}/${crypto.randomUUID()}`;
      await env.PRIVATE_RECEIPTS.put(path, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          cacheControl: "private, no-store",
        },
      });
      return Response.json({ path }, { status: 201, headers: privateHeaders });
    }
    if (request.method === "GET") {
      const path = data.fields?.receiptPath?.stringValue;
      if (
        !path ||
        !ownerId ||
        !path.startsWith(`receipts/${ownerId}/${id}/`) ||
        path.split("/").length !== 4
      )
        return fail("Payment proof not available.", 404);
      const object = await env.PRIVATE_RECEIPTS.get(path);
      if (!object) return fail("Payment proof not available.", 404);
      return new Response(object.body, {
        headers: {
          ...privateHeaders,
          "Content-Type":
            object.httpMetadata?.contentType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="payment-proof-${id}"`,
        },
      });
    }
    return fail("Method not allowed.", 405);
  } catch {
    return fail(
      "Payment proof could not be accessed. Check your session and try again.",
      401,
    );
  }
}
export async function handleAnalytics(
  request: Request,
  env: Env,
): Promise<Response> {
  const token = request.headers
    .get("Authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return fail("Authentication required.", 401);
  try {
    const user = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    if (
      (await getFirebaseRole(token, env.FIREBASE_PROJECT_ID, user.sub!)) !==
      "superuser"
    )
      return fail("Superuser access required.", 403);
    if (!env.ANALYTICS_API_TOKEN || !env.ANALYTICS_ZONE_ID)
      return fail("Analytics is not connected.", 503);
    const end = new Date();
    const start = new Date(end.getTime() - 7 * 86400000);
    const response = await fetch(
      "https://api.cloudflare.com/client/v4/graphql",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.ANALYTICS_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query:
            'query Traffic($zone: string!, $start: Time!, $end: Time!) { viewer { zones(filter: {zoneTag: $zone}) { httpRequestsAdaptiveGroups(limit: 1, filter: {datetime_geq: $start, datetime_lt: $end, requestSource: "eyeball"}) { count sum { visits edgeResponseBytes } } } } }',
          variables: {
            zone: env.ANALYTICS_ZONE_ID,
            start: start.toISOString(),
            end: end.toISOString(),
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const result = (await response.json()) as {
      errors?: unknown;
      data?: {
        viewer?: {
          zones?: {
            httpRequestsAdaptiveGroups?: {
              count?: number;
              sum?: { visits?: number; edgeResponseBytes?: number };
            }[];
          }[];
        };
      };
    };
    if (!response.ok || result.errors)
      return fail("Analytics provider unavailable.", 502);
    const group =
      result.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups?.[0];
    if (!group) return fail("No analytics data available for this zone.", 503);
    return Response.json(
      {
        requests: group.count || 0,
        visits: group.sum?.visits || 0,
        bytes: group.sum?.edgeResponseBytes || 0,
      },
      { headers: privateHeaders },
    );
  } catch {
    return fail("Analytics request unavailable.", 502);
  }
}
