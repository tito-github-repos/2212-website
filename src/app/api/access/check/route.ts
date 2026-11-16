import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/generated/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { createDownloadPass } from "@/lib/downloadPass";
import { getPlanStatus, getWorksheetAccess } from "@/lib/planAccess";

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// WORKSHEET here means "can this email download the worksheets?"
// (free for 1 year after a paid DD Web App or Book payment).
// WEBAPP means "does this email have an active DD Web App plan?".
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

    // NOT_REGISTERED   : no registration for this email
    // REGISTERED_UNPAID: registered, has never paid for a qualifying product
    // PAID             : access is still active
    // PLAN_EXPIRED     : has paid before, but the access has ended
    const plan =
      product === Product.WORKSHEET
        ? await getWorksheetAccess(email)
        : await getPlanStatus(email, Product.WEBAPP);

    const { status, validUntil } = plan;

    // Only the worksheet check gets a download pass. A paid DD Web App or Book
    // user passes it, so they can download the PDFs.
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