import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

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
    const turnstileToken =
      typeof body.turnstileToken === "string" ? body.turnstileToken : "";

    if (!emailRegex.test(email) || email.length > 120) {
      return fail("Enter a valid email address", 400);
    }

    if (!PRODUCTS.includes(product)) {
      return fail("Invalid request", 400);
    }

    if (!turnstileToken) {
      return fail("Verification is required", 400);
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return fail("Verification failed. Please try again.", 400);
    }

    // One indexed query: registration + a valid PAID payment for this product
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

    const status = !registration
      ? "NOT_REGISTERED"
      : registration.payments.length > 0
        ? "PAID"
        : "REGISTERED_UNPAID";

    return NextResponse.json(
      { success: true, status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Access Check Error:", error);
    return fail("Something went wrong", 500);
  }
}