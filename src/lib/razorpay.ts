import crypto from "crypto";
import type { Product } from "@/generated/prisma";

// Amounts in paise. The server is the only source of truth for price.
export const PRODUCT_CONFIG: Record<
  Product,
  { label: string; amount: number }
> = {
  WORKSHEET: { label: "Worksheet Download", amount: 72900 },
};

// Change validity rules here (e.g. a fixed cutoff for COMPETITION)
export function getValidUntil(_product: Product, paidAt: Date) {
  const d = new Date(paidAt);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

export async function createRazorpayOrder(args: {
  amount: number;
  receipt: string;
  notes: Record<string, string>;
}) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Missing Razorpay keys");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    },
    body: JSON.stringify({ ...args, currency: "INR" }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Razorpay order failed: ${res.status} ${await res.text()}`);
  }

  return (await res.json()) as { id: string; amount: number; currency: string };
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const hmac = (secret: string, data: string) =>
  crypto.createHmac("sha256", secret).update(data).digest("hex");

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Missing RAZORPAY_KEY_SECRET");
  return safeEqual(hmac(secret, `${orderId}|${paymentId}`), signature);
}

export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET");
  return safeEqual(hmac(secret, rawBody), signature);
}
