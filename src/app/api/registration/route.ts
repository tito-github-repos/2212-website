import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  sendAdminNotification,
  sendStudentConfirmation,
} from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { name, email, mobile } = body;

    if (!name || !email || !mobile) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
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

      // Send emails (doesn't fail the registration if email sending fails)
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
      // Registration is already saved, so don't return an error.
    }

    return NextResponse.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
