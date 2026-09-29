import {
  verifyAdminRole,
  verifyFirebaseToken,
} from "./auth";

interface Env {
  mcs_symposium_2026_media: R2Bucket;
  ASSETS: Fetcher;
  FIREBASE_PROJECT_ID: string;
}

const ALLOWED_FOLDERS = new Set([
  "presenters",
  "gallery",
  "sponsors",
  "documents",
]);

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DOCUMENT_TYPES = new Set([
  "application/pdf",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;

interface AdminResult {
  authorized: boolean;
  response?: Response;
}

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim();
}

async function requireAdmin(
  request: Request,
  env: Env,
): Promise<AdminResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      authorized: false,
      response: Response.json(
        {
          error: "Authentication is required.",
        },
        { status: 401 },
      ),
    };
  }

  try {
    const user = await verifyFirebaseToken(
      token,
      env.FIREBASE_PROJECT_ID,
    );

    const uid = user.sub;

    if (!uid) {
      return {
        authorized: false,
        response: Response.json(
          {
            error:
              "Authenticated user ID is unavailable.",
          },
          { status: 401 },
        ),
      };
    }

    const isAdmin = await verifyAdminRole(
      token,
      env.FIREBASE_PROJECT_ID,
      uid,
    );

    if (!isAdmin) {
      return {
        authorized: false,
        response: Response.json(
          {
            error:
              "Administrator access is required.",
          },
          { status: 403 },
        ),
      };
    }

    return {
      authorized: true,
    };
  } catch (error) {
    console.error(
      "Administrator verification failed:",
      error,
    );

    return {
      authorized: false,
      response: Response.json(
        {
          error:
            "Invalid or expired authentication token.",
        },
        { status: 401 },
      ),
    };
  }
}

function sanitizeFileName(
  fileName: string,
): string {
  const lastDot = fileName.lastIndexOf(".");

  const rawName =
    lastDot > 0
      ? fileName.slice(0, lastDot)
      : fileName;

  const extension =
    lastDot > 0
      ? fileName.slice(lastDot).toLowerCase()
      : "";

  const safeName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeName || "file"}${extension}`;
}

function createObjectKey(
  folder: string,
  fileName: string,
): string {
  const safeFileName =
    sanitizeFileName(fileName);

  const uniqueId = crypto.randomUUID();

  return `${folder}/${uniqueId}-${safeFileName}`;
}

function validateUpload(
  file: File,
  folder: string,
): string | null {
  if (!ALLOWED_FOLDERS.has(folder)) {
    return "Invalid storage folder.";
  }

  if (file.size === 0) {
    return "The selected file is empty.";
  }

  if (folder === "documents") {
    if (!DOCUMENT_TYPES.has(file.type)) {
      return "Documents must be PDF files.";
    }

    if (file.size > MAX_DOCUMENT_SIZE) {
      return "Documents must not exceed 10 MB.";
    }

    return null;
  }

  if (!IMAGE_TYPES.has(file.type)) {
    return "Images must be JPEG, PNG, or WebP.";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "Images must not exceed 5 MB.";
  }

  return null;
}

function extractObjectKey(
  pathname: string,
): string | null {
  const prefix = "/api/storage/file/";

  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const encodedKey = pathname.slice(
    prefix.length,
  );

  if (!encodedKey) {
    return null;
  }

  try {
    const key = decodeURIComponent(encodedKey);

    if (
      !key ||
      key.startsWith("/") ||
      key.includes("..")
    ) {
      return null;
    }

    const folder = key.split("/")[0];

    if (!ALLOWED_FOLDERS.has(folder)) {
      return null;
    }

    return key;
  } catch {
    return null;
  }
}

async function handleUpload(
  request: Request,
  env: Env,
): Promise<Response> {
  const admin = await requireAdmin(
    request,
    env,
  );

  if (!admin.authorized) {
    return admin.response!;
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      {
        error:
          "The upload request is not valid form data.",
      },
      { status: 400 },
    );
  }

  const fileValue = formData.get("file");
  const folderValue = formData.get("folder");

  if (!(fileValue instanceof File)) {
    return Response.json(
      {
        error: "A file is required.",
      },
      { status: 400 },
    );
  }

  if (
    typeof folderValue !== "string" ||
    !folderValue
  ) {
    return Response.json(
      {
        error: "A storage folder is required.",
      },
      { status: 400 },
    );
  }

  const validationError =
    validateUpload(
      fileValue,
      folderValue,
    );

  if (validationError) {
    return Response.json(
      {
        error: validationError,
      },
      { status: 400 },
    );
  }

  const key = createObjectKey(
    folderValue,
    fileValue.name,
  );

  await env.mcs_symposium_2026_media.put(
    key,
    fileValue.stream(),
    {
      httpMetadata: {
        contentType: fileValue.type,
        cacheControl:
          "public, max-age=3600",
      },
      customMetadata: {
        originalName: fileValue.name,
      },
    },
  );

  const encodedKey =
    encodeURIComponent(key);

  return Response.json(
    {
      ok: true,
      path: key,
      fileName: fileValue.name,
      url: `/api/storage/file/${encodedKey}`,
    },
    { status: 201 },
  );
}

async function handleGetFile(
  key: string,
  env: Env,
): Promise<Response> {
  const object =
    await env.mcs_symposium_2026_media.get(
      key,
    );

  if (!object) {
    return Response.json(
      {
        error: "File not found.",
      },
      { status: 404 },
    );
  }

  const headers = new Headers();

  object.writeHttpMetadata(headers);

  headers.set(
    "etag",
    object.httpEtag,
  );

  headers.set(
    "Cache-Control",
    "public, max-age=3600",
  );

  headers.set(
    "X-Content-Type-Options",
    "nosniff",
  );

  return new Response(object.body, {
    headers,
  });
}

async function handleDeleteFile(
  request: Request,
  key: string,
  env: Env,
): Promise<Response> {
  const admin = await requireAdmin(
    request,
    env,
  );

  if (!admin.authorized) {
    return admin.response!;
  }

  const existing =
    await env.mcs_symposium_2026_media.head(
      key,
    );

  if (!existing) {
    return Response.json(
      {
        error: "File not found.",
      },
      { status: 404 },
    );
  }

  await env.mcs_symposium_2026_media.delete(
    key,
  );

  return Response.json({
    ok: true,
    deleted: key,
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
  ): Promise<Response> {
    const url = new URL(request.url);

    /*
     * Public API health check.
     *
     * This intentionally does not perform an R2
     * list/head/get operation. It only confirms
     * that the Worker storage API is responding.
     */
    if (
      url.pathname ===
        "/api/storage/health" &&
      request.method === "GET"
    ) {
      return Response.json(
        {
          ok: true,
          service:
            "MCS Symposium Storage API",
          status: "healthy",
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    /*
     * Protected administrator authorization check.
     */
    if (
      url.pathname ===
        "/api/storage/auth-check" &&
      request.method === "GET"
    ) {
      const admin = await requireAdmin(
        request,
        env,
      );

      if (!admin.authorized) {
        return admin.response!;
      }

      return Response.json({
        authenticated: true,
        authorized: true,
      });
    }

    /*
     * Protected R2 upload endpoint.
     */
    if (
      url.pathname ===
        "/api/storage/upload" &&
      request.method === "POST"
    ) {
      return handleUpload(
        request,
        env,
      );
    }

    const objectKey =
      extractObjectKey(url.pathname);

    /*
     * Public file retrieval.
     */
    if (
      objectKey &&
      request.method === "GET"
    ) {
      return handleGetFile(
        objectKey,
        env,
      );
    }

    /*
     * Protected R2 delete endpoint.
     */
    if (
      objectKey &&
      request.method === "DELETE"
    ) {
      return handleDeleteFile(
        request,
        objectKey,
        env,
      );
    }

    /*
     * Reject unknown storage API routes.
     */
    if (
      url.pathname.startsWith(
        "/api/storage/",
      )
    ) {
      return Response.json(
        {
          error:
            "Storage API route not found.",
        },
        { status: 404 },
      );
    }

    /*
     * All non-API requests are handled by
     * the Vite static assets / SPA.
     */
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;