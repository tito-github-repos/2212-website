export async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Missing CLOUDFLARE_TURNSTILE_SECRET_KEY");

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: formData, signal: AbortSignal.timeout(5000) },
  );

  const result = await response.json();
  return result.success === true;
}