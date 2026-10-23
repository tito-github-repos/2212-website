import { NextRequest, NextResponse } from "next/server";
import { Product } from "@/generated/prisma";
import { verifyFirebaseIdToken } from "@/lib/firebaseToken";
import { getPlanStatus } from "@/lib/planAccess";

export const runtime = "nodejs";

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

// The browser sends the student's Firebase sign-in token as "Authorization: Bearer ...".
// The email comes from the verified token, never from the request body, so nobody
// can ask about someone else's plan.
export async function POST(req: NextRequest) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return fail("Please sign in", 401);

    let user;
    try {
      user = await verifyFirebaseIdToken(token);
    } catch {
      return fail("Please sign in again", 401);
    }

    if (!user.emailVerified) return fail("Your email is not verified", 403);

    const plan = await getPlanStatus(user.email, Product.WORKSHEET);

    return NextResponse.json(
      {
        success: true,
        status: plan.status,
        validUntil: plan.validUntil,
        email: user.email,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Web Access Check Error:", error);
    return fail("Something went wrong", 500);
  }
}