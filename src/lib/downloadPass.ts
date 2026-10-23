import crypto from "crypto";

// How long a download link works after the student's email check or payment
const DEFAULT_TTL_SECONDS = 30 * 60;

function getSecret() {
  const secret = process.env.DOWNLOAD_PASS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Missing or too short DOWNLOAD_PASS_SECRET");
  }
  return secret;
}

const sign = (data: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(data).digest("base64url");

// A short-lived signed pass for one email. Nothing is stored in the database.
export function createDownloadPass(
  email: string,
  ttlSeconds = DEFAULT_TTL_SECONDS,
) {
  const payload = Buffer.from(
    JSON.stringify({
      e: email.trim().toLowerCase(),
      x: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload, getSecret())}`;
}

// Returns the email when the pass is genuine and not expired, otherwise null
export function verifyDownloadPass(pass: string): string | null {
  const parts = pass.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  const expected = Buffer.from(sign(payload, getSecret()));
  const given = Buffer.from(signature);

  if (given.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(given, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (typeof data.e !== "string" || typeof data.x !== "number") return null;
    if (data.x < Math.floor(Date.now() / 1000)) return null;

    return data.e;
  } catch {
    return null;
  }
}