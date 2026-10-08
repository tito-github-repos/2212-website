// import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
// import { getValidUntil, verifyPaymentSignature } from "@/lib/razorpay";

// export const runtime = "nodejs";

// const fail = (message: string, status: number) =>
//   NextResponse.json({ success: false, message }, { status });

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json().catch(() => ({}));
//     const orderId =
//       typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
//     const paymentId =
//       typeof body.razorpay_payment_id === "string"
//         ? body.razorpay_payment_id
//         : "";
//     const signature =
//       typeof body.razorpay_signature === "string"
//         ? body.razorpay_signature
//         : "";

//     if (!orderId || !paymentId || !signature)
//       return fail("Invalid request", 400);

//     if (!verifyPaymentSignature(orderId, paymentId, signature)) {
//       return fail("Payment verification failed", 400);
//     }

//     const payment = await prisma.payment.findUnique({
//       where: { razorpayOrderId: orderId },
//     });
//     if (!payment) return fail("Order not found", 404);

//     if (payment.status !== "PAID") {
//       const paidAt = new Date();
//       // updateMany + status guard = safe if the webhook marks it at the same moment
//       await prisma.payment.updateMany({
//         where: { razorpayOrderId: orderId, status: { not: "PAID" } },
//         data: {
//           status: "PAID",
//           razorpayPaymentId: paymentId,
//           paidAt,
//           validUntil: getValidUntil(payment.product, paidAt),
//         },
//       });
//     }

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Verify Payment Error:", error);
//     return fail("Something went wrong", 500);
//   }
// }





import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidUntil, verifyPaymentSignature } from "@/lib/razorpay";
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
          paidAt,
          validUntil: getValidUntil(payment.product, paidAt),
        },
      });

      if (count > 0) {
        // runs after the response is sent, and Vercel keeps the function alive for it
        after(() => notifyPaymentSuccess(orderId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    return fail("Something went wrong", 500);
  }
}