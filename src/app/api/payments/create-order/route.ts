import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { PRODUCT_CONFIG, createRazorpayOrder } from "@/lib/razorpay";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const PRODUCTS = Object.values(Product) as string[];

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

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
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Create Order Error:", error);
    return fail("Something went wrong", 500);
  }
}
