export const projectId = "mcs-symposium-v2-development";
export function validateV2Environment(env) {
  if (env.VITE_FIREBASE_PROJECT_ID !== projectId) {
    throw new Error(
      `V2 must use ${projectId}. Refusing to use the V1 or another Firebase project.`,
    );
  }
  if (env.VITE_FIREBASE_AUTH_DOMAIN !== `${projectId}.firebaseapp.com`) {
    throw new Error("V2 Firebase authDomain does not match its project.");
  }
  if (env.VITE_FIREBASE_STORAGE_BUCKET !== `${projectId}.firebasestorage.app`) {
    throw new Error("V2 Firebase storageBucket does not match its project.");
  }
  if (env.VITE_FIREBASE_MESSAGING_SENDER_ID !== "689947459888") {
    throw new Error(
      "V2 Firebase messagingSenderId does not match its project number.",
    );
  }
  if (!/^AIza[A-Za-z0-9_-]{35}$/.test(env.VITE_FIREBASE_API_KEY || "")) {
    throw new Error(
      "Copy the exact apiKey from Firebase into VITE_FIREBASE_API_KEY. Do not copy it from an image.",
    );
  }
  if (!/^1:689947459888:web:[a-f0-9]+$/.test(env.VITE_FIREBASE_APP_ID || "")) {
    throw new Error(
      "Copy the exact appId from Firebase into VITE_FIREBASE_APP_ID.",
    );
  }
}
