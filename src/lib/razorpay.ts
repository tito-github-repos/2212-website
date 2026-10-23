
import crypto from "crypto";
import type { Product } from "@/generated/prisma";

// Amounts in paise. The server is the only source of truth for price.
// WORKSHEET (worksheets + web app) is ₹333 per month.
// BOOK is ₹222 for one copy delivered to the buyer's address.
export const PRODUCT_CONFIG: Record<
  Product,
  { label: string; amount: number }
> = {
  WORKSHEET: { label: "Worksheets + DD Web App", amount: 33300 },
  BOOK: { label: "2212 Book (1 copy)", amount: 22200 },
};

// How many months of access one payment gives. Products not listed here
// (like BOOK) have no access period.
const ACCESS_MONTHS: Partial<Record<Product, number>> = {
  WORKSHEET: 1,
};

// Adds calendar months and clamps to the last day of the target month
// (31 Jan + 1 month = 28/29 Feb, not 3 Mar)
function addMonths(date: Date, months: number) {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

// Returns null for products with no expiry (BOOK)
export function getValidUntil(product: Product, paidAt: Date): Date | null {
  const months = ACCESS_MONTHS[product];
  return months ? addMonths(paidAt, months) : null;
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