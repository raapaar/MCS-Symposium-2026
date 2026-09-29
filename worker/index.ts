import {
  verifyAdminRole,
  verifyFirebaseToken,
} from "./auth";

interface Env {
  mcs_symposium_2026_media: R2Bucket;
  ASSETS: Fetcher;
  FIREBASE_PROJECT_ID: string;
}

function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim();
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Public storage health check.
    if (url.pathname === "/api/storage/health") {
      const objects = await env.mcs_symposium_2026_media.list({
        limit: 1,
      });

      return Response.json({
        ok: true,
        service: "MCS Symposium R2 Storage",
        bucketConnected: true,
        objectCountChecked: objects.objects.length,
      });
    }

    // Authentication test. No R2 write operations occur here.
    if (url.pathname === "/api/storage/auth-check") {
      const token = getBearerToken(request);

      if (!token) {
        return Response.json(
          {
            authenticated: false,
            error: "Missing authentication token.",
          },
          { status: 401 },
        );
      }

      try {
       const user = await verifyFirebaseToken(
  token,
  env.FIREBASE_PROJECT_ID,
);

const uid = user.sub;

if (!uid) {
  return Response.json(
    {
      authenticated: false,
      authorized: false,
      error: "Authenticated user ID is unavailable.",
    },
    { status: 401 },
  );
}

const isAdmin = await verifyAdminRole(
  token,
  env.FIREBASE_PROJECT_ID,
  uid,
);

if (!isAdmin) {
  return Response.json(
    {
      authenticated: true,
      authorized: false,
      error: "Administrator access is required.",
    },
    { status: 403 },
  );
}

return Response.json({
  authenticated: true,
  authorized: true,
  uid,
});
      } catch (error) {
        console.error("Firebase token verification failed:", error);

        return Response.json(
          {
            authenticated: false,
            error: "Invalid or expired authentication token.",
          },
          { status: 401 },
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;