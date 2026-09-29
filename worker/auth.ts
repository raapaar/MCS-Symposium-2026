import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from "jose";

const FIREBASE_CERTS_URL =
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  );

const firebaseKeys = createRemoteJWKSet(FIREBASE_CERTS_URL);

export interface FirebaseUser extends JWTPayload {
  user_id?: string;
  email?: string;
}

export async function verifyFirebaseToken(
  token: string,
  projectId: string,
): Promise<FirebaseUser> {
  const { payload } = await jwtVerify(token, firebaseKeys, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
  });

  if (!payload.sub) {
    throw new Error(
      "Firebase token does not contain a user ID.",
    );
  }

  return payload as FirebaseUser;
}

export async function verifyAdminRole(
  token: string,
  projectId: string,
  uid: string,
): Promise<boolean> {
  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/` +
    `${projectId}/databases/(default)/documents/users/` +
    encodeURIComponent(uid);

  const response = await fetch(documentUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      "Firestore admin-role check failed:",
      response.status,
    );

    return false;
  }

  const document = await response.json() as {
    fields?: {
      role?: {
        stringValue?: string;
      };
    };
  };

  return document.fields?.role?.stringValue === "admin";
}