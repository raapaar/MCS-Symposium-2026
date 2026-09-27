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
    throw new Error("Firebase token does not contain a user ID.");
  }

  return payload as FirebaseUser;
}