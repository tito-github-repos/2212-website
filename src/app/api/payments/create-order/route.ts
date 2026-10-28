import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { PRODUCT_CONFIG, createRazorpayOrder } from "@/lib/razorpay";
import {
  UNPAID_WINDOW_MS,
  expireStalePayments,
} from "@/lib/payment-cleanup";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// Products with an access period go through this route.
// BOOK has its own flow at /api/book-orders (it needs the delivery address).
const PRODUCTS: string[] = [Product.WORKSHEET, Product.WEBAPP];

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

const noStore = { headers: { "Cache-Control": "no-store" } };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const product = typeof body.product === "string" ? body.product : "";

    if (!emailRegex.test(email) || email.length > 120) {
      return fail("Enter a valid email address", 400);
    }
    if (!PRODUCTS.includes(product)) return fail("Invalid request", 400);

    const config = PRODUCT_CONFIG[product as Product];

    // Mark abandoned checkouts (unpaid for 24h+) as EXPIRED. Never throws.
    await expireStalePayments();

    const registration = await prisma.registration.findUnique({
      where: { email },
      select: {
        id: true,
        payments: {
          where: {
            product: product as Product,
            status: "PAID",
            validUntil: { gt: new Date() },
          },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!registration) return fail("Please register first", 404);
    if (registration.payments.length > 0) return fail("Already paid", 409);

    // Reuse this user's unpaid order for this product from the last 24 hours instead
    // of creating a new one. Razorpay allows retries on the same order, and once it is
    // paid it can't be paid again. The amount check stops an old price being reused.
    const existing = await prisma.payment.findFirst({
      where: {
        registrationId: registration.id,
        product: product as Product,
        status: { in: ["CREATED", "FAILED"] },
        amount: config.amount,
        createdAt: { gte: new Date(Date.now() - UNPAID_WINDOW_MS) },
      },
      orderBy: { createdAt: "desc" },
      select: { razorpayOrderId: true, amount: true, currency: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          orderId: existing.razorpayOrderId,
          amount: existing.amount,
          currency: existing.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
        noStore,
      );
    }

    const order = await createRazorpayOrder({
      amount: config.amount, // server-side price only
      receipt: `r${registration.id}_${Date.now()}`,
      notes: { site: "2212", product, registrationId: String(registration.id) },
    });

    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        product: product as Product,
        amount: config.amount,
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
      noStore,
    );
  } catch (error) {
    console.error("Create Order Error:", error);
    return fail("Something went wrong", 500);
  }
}