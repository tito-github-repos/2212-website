import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { PRODUCT_CONFIG, createRazorpayOrder } from "@/lib/razorpay";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  UNPAID_WINDOW_MS,
  expireStalePayments,
  purgeUnpaidBookAddresses,
} from "@/lib/payment-cleanup";

export const runtime = "nodejs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const isRepeatedDigits = (v: string) => /^(\d)\1{9}$/.test(v);
const isSequential = (v: string) =>
  "01234567890123456789".includes(v) || "98765432109876543210".includes(v);

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

const noStore = { headers: { "Cache-Control": "no-store" } };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

type BookForm = {
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

// Returns an error message, or null when everything is valid.
// Same rules as the form in BookOrderModal.tsx. The server never trusts the browser.
function validate(f: BookForm): string | null {
  if (!/^[A-Za-z ]+$/.test(f.name) || f.name.length < 3 || f.name.length > 100)
    return "Enter a valid full name";
  if (!emailRegex.test(f.email) || f.email.length > 120)
    return "Enter a valid email address";
  if (
    !/^[6-9]\d{9}$/.test(f.mobile) ||
    isRepeatedDigits(f.mobile) ||
    isSequential(f.mobile)
  )
    return "Enter a valid 10-digit phone number";
  if (f.address.length < 10 || f.address.length > 200)
    return "Enter the full delivery address";
  if (!/^[A-Za-z .]+$/.test(f.city) || f.city.length < 2 || f.city.length > 60)
    return "Enter a valid city";
  if (
    !/^[A-Za-z .]+$/.test(f.state) ||
    f.state.length < 2 ||
    f.state.length > 60
  )
    return "Enter a valid state";
  if (!/^[1-9]\d{5}$/.test(f.pincode)) return "Enter a valid 6-digit pincode";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const form: BookForm = {
      name: text(body.name),
      email: text(body.email).toLowerCase(),
      mobile: text(body.mobile),
      address: text(body.address),
      city: text(body.city),
      state: text(body.state),
      pincode: text(body.pincode),
    };

    const invalid = validate(form);
    if (invalid) return fail(invalid, 400);

    // Bot protection, same layers as the registration form
    if (text(body.website)) return fail("Invalid request", 400); // honeypot

    const elapsed = Date.now() - Number(body.formStartedAt);
    // Only reject a clearly instant submit. Missing or odd client clocks pass,
    // Turnstile below is the real gate.
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < 3000) {
      return fail("Please try again", 400);
    }

    const turnstileToken = text(body.turnstileToken);
    if (!turnstileToken) return fail("Verification is required", 400);

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    if (!(await verifyTurnstile(turnstileToken, ip))) {
      return fail("Verification failed. Please try again.", 400);
    }

    // Housekeeping, neither call throws:
    // abandoned checkouts -> EXPIRED, old unpaid addresses are removed
    await expireStalePayments();
    await purgeUnpaidBookAddresses();

    // payment.registrationId is required, so find the buyer's registration by
    // email or create one. An existing registration is never changed.
    const registration = await prisma.registration.upsert({
      where: { email: form.email },
      update: {},
      create: { name: form.name, email: form.email, mobile: form.mobile },
      select: { id: true },
    });

    const config = PRODUCT_CONFIG[Product.BOOK];

    // Reuse this buyer's unpaid book order from the last 24 hours and save the
    // newest address on it. The address only lives in our database, so the same
    // Razorpay order can be used. The amount check stops an old price being reused.
    const existing = await prisma.payment.findFirst({
      where: {
        registrationId: registration.id,
        product: Product.BOOK,
        status: { in: ["CREATED", "FAILED"] },
        amount: config.amount,
        createdAt: { gte: new Date(Date.now() - UNPAID_WINDOW_MS) },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, razorpayOrderId: true, amount: true, currency: true },
    });

    if (existing) {
      const { count } = await prisma.bookOrder.updateMany({
        where: { paymentId: existing.id },
        data: {
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
      });

      if (count > 0) {
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
      // No address row on it (shouldn't happen): fall through and make a new order
    }

    const order = await createRazorpayOrder({
      amount: config.amount, // server-side price only
      receipt: `b${registration.id}_${Date.now()}`,
      notes: {
        site: "2212",
        product: Product.BOOK,
        registrationId: String(registration.id),
      },
    });

    // payment + bookOrder are created together, so there is never a book payment
    // without an address
    await prisma.payment.create({
      data: {
        registrationId: registration.id,
        product: Product.BOOK,
        amount: config.amount,
        razorpayOrderId: order.id,
        bookOrder: {
          create: {
            name: form.name,
            email: form.email,
            mobile: form.mobile,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
        },
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
    console.error("Book Order Create Error:", error);
    return fail("Something went wrong", 500);
  }
}