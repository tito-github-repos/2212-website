import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAdminNotification,
  sendStudentConfirmation,
} from "@/lib/email";

const nameRegex = /^[A-Za-z ]+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const mobileRegex = /^[6-9]\d{9}$/;

const isRepeatedDigits = (value: string) => /^(\d)\1{9}$/.test(value);

const isSequential = (value: string) => {
  const ascending = "01234567890123456789";
  const descending = "98765432109876543210";
  return ascending.includes(value) || descending.includes(value);
};

async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing CLOUDFLARE_TURNSTILE_SECRET_KEY");
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  if (ip) {
    formData.append("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  const result = await response.json();

  return result.success === true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";
    const turnstileToken =
      typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    const formStartedAt =
      typeof body.formStartedAt === "number" ? body.formStartedAt : 0;

    // Honeypot protection
    if (website) {
      return NextResponse.json({
        success: true,
        message: "Registration submitted successfully",
      });
    }

    if (!name || !email || !mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      );
    }

    if (!nameRegex.test(name) || name.length < 3 || name.length > 80) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid full name",
        },
        { status: 400 },
      );
    }

    if (!emailRegex.test(email) || email.length > 120) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid email address",
        },
        { status: 400 },
      );
    }

    if (
      !mobileRegex.test(mobile) ||
      isRepeatedDigits(mobile) ||
      isSequential(mobile)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter a valid mobile number",
        },
        { status: 400 },
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification is required",
        },
        { status: 400 },
      );
    }

    if (!formStartedAt || Date.now() - formStartedAt < 2000) {
      return NextResponse.json(
        {
          success: false,
          message: "Please try again",
        },
        { status: 400 },
      );
    }

    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

    const isHuman = await verifyTurnstile(turnstileToken, ip);

    if (!isHuman) {
      return NextResponse.json(
        {
          success: false,
          message: "Verification failed. Please try again.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.registration.findUnique({
      where: {
        email,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Email already registered",
        },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.create({
      data: {
        name,
        email,
        mobile,
      },
    });

    try {
      await Promise.all([
        sendStudentConfirmation({
          name: registration.name,
          email: registration.email,
        }),

        sendAdminNotification({
          name: registration.name,
          email: registration.email,
          mobile: registration.mobile,
        }),
      ]);
    } catch (emailError) {
      console.error("Email Sending Error:", emailError);
    }

    return NextResponse.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error("Registration Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}