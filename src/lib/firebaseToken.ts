import { createRemoteJWKSet, jwtVerify } from "jose";

// Google's public keys for Firebase sign-in tokens. jose caches them.
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

// Checks that a Firebase ID token is genuine, unexpired and made for THIS project.
// Throws if anything is wrong.
export async function verifyFirebaseIdToken(token: string) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID");

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
  });

  const email =
    typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";

  if (!payload.sub || !email) throw new Error("Token has no user or email");

  return {
    uid: payload.sub,
    email,
    emailVerified: payload.email_verified === true,
  };
}