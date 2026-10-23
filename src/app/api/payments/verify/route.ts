import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { getValidUntil, verifyPaymentSignature } from "@/lib/razorpay";
import { createDownloadPass } from "@/lib/downloadPass";
import { notifyPaymentSuccess } from "@/lib/payment-notifications";

export const runtime = "nodejs";

const fail = (message: string, status: number) =>
  NextResponse.json({ success: false, message }, { status });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId =
      typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId =
      typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature =
      typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

    if (!orderId || !paymentId || !signature) return fail("Invalid request", 400);

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return fail("Payment verification failed", 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { registration: { select: { email: true } } },
    });
    if (!payment) return fail("Order not found", 404);

    if (payment.status !== "PAID") {
      const paidAt = new Date();
      // updateMany + status guard: only the request that flips the status gets count > 0
      const { count } = await prisma.payment.updateMany({
        where: { razorpayOrderId: orderId, status: { not: "PAID" } },
        data: {
          status: "PAID",
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          paidAt,
          validUntil: getValidUntil(payment.product, paidAt),
        },
      });

      if (count > 0) {
        // runs after the response is sent, and Vercel keeps the function alive for it
        after(() => notifyPaymentSuccess(orderId));
      }
    } else if (!payment.razorpaySignature) {
      // The webhook marked it paid first and has no checkout signature.
      // This one is verified above, so save it for the record.
      await prisma.payment.updateMany({
        where: {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: null,
        },
        data: { razorpaySignature: signature },
      });
    }

    // The verified signature proves this browser just paid, so hand out the
    // download pass (worksheets only, a book has nothing to download)
    let downloadPass: string | undefined;
    if (payment.product === Product.WORKSHEET) {
      try {
        downloadPass = createDownloadPass(payment.registration.email);
      } catch (error) {
        console.error("Download pass error:", error);
      }
    }

    return NextResponse.json({ success: true, downloadPass });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return fail("Something went wrong", 500);
  }
}