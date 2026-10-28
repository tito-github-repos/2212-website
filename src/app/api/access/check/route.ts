import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { createDownloadPass } from "@/lib/downloadPass";

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// Products with an access period go through this route.
// BOOK has its own flow at /api/book-orders.
const PRODUCTS: string[] = [Product.WORKSHEET, Product.WEBAPP];

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

    // One indexed query: registration + the latest PAID payment for this product
    const registration = await prisma.registration.findUnique({
      where: { email },
      select: {
        id: true,
        payments: {
          where: {
            product: product as Product,
            status: "PAID",
            validUntil: { not: null },
          },
          orderBy: { validUntil: "desc" },
          select: { validUntil: true },
          take: 1,
        },
      },
    });

    // NOT_REGISTERED   : no registration for this email
    // REGISTERED_UNPAID: registered, has never paid for this product
    // PAID             : latest paid plan is still active
    // PLAN_EXPIRED     : has paid before, but the latest plan has ended
    let status:
      | "NOT_REGISTERED"
      | "REGISTERED_UNPAID"
      | "PAID"
      | "PLAN_EXPIRED";
    let validUntil: string | null = null;

    if (!registration) {
      status = "NOT_REGISTERED";
    } else {
      const latest = registration.payments[0]?.validUntil ?? null;
      if (!latest) {
        status = "REGISTERED_UNPAID";
      } else {
        validUntil = latest.toISOString();
        status = latest > new Date() ? "PAID" : "PLAN_EXPIRED";
      }
    }

    // Only the DD Worksheets includes the PDFs, so only it gets a download pass
    let downloadPass: string | undefined;
    if (status === "PAID" && product === Product.WORKSHEET) {
      try {
        downloadPass = createDownloadPass(email);
      } catch (error) {
        console.error("Download pass error:", error);
      }
    }

    return NextResponse.json(
      { success: true, status, validUntil, downloadPass },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Access Check Error:", error);
    return fail("Something went wrong", 500);
  }
}