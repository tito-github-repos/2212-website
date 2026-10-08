import { NextRequest, NextResponse, after } from "next/server";
import { notifyPaymentSuccess } from "@/lib/payment-notifications";
import { prisma } from "@/lib/prisma";
import { getValidUntil, verifyWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Signature is computed on the RAW body, so read text, not json
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.event !== "payment.captured" && event.event !== "order.paid") {
      return NextResponse.json({ received: true });
    }

    const entity = event.payload?.payment?.entity;
    const orderId: string | undefined = entity?.order_id;
    const paymentId: string | undefined = entity?.id;

    if (!orderId || !paymentId) return NextResponse.json({ received: true });

    // Shared Razorpay account: events for other sites' orders won't be in our DB. Ignore them.
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });
    if (!payment) return NextResponse.json({ received: true });

    if (entity.amount !== payment.amount) {
      console.error("Webhook amount mismatch", { orderId });
      return NextResponse.json({ received: true });
    }

    // if (payment.status !== "PAID") {
    //   const paidAt = new Date();
    //   await prisma.payment.updateMany({
    //     where: { razorpayOrderId: orderId, status: { not: "PAID" } },
    //     data: {
    //       status: "PAID",
    //       razorpayPaymentId: paymentId,
    //       paidAt,
    //       validUntil: getValidUntil(payment.product, paidAt),
    //     },
    //   });
    // }

    if (payment.status !== "PAID") {
      const paidAt = new Date();
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
        after(() => notifyPaymentSuccess(orderId));
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    // 500 makes Razorpay retry, which is what we want for transient DB errors
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
