import { prisma } from "@/lib/prisma";
import { PRODUCT_CONFIG } from "@/lib/razorpay";
import {
  sendPaymentConfirmation,
  sendPaymentAdminNotification,
} from "@/lib/email";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

// Never throws: email problems must not affect payment handling.
export async function notifyPaymentSuccess(orderId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { registration: true },
    });

    if (
      !payment ||
      payment.status !== "PAID" ||
      !payment.paidAt ||
      !payment.validUntil ||
      !payment.razorpayPaymentId
    ) {
      return;
    }

    const details = {
      productLabel: PRODUCT_CONFIG[payment.product].label,
      amountText: `₹${(payment.amount / 100).toFixed(2)}`,
      paymentId: payment.razorpayPaymentId,
      paidOn: formatDate(payment.paidAt),
      validTill: formatDate(payment.validUntil),
    };

    const { name, email, mobile } = payment.registration;

    const results = await Promise.allSettled([
      sendPaymentConfirmation({ name, email, ...details }),
      sendPaymentAdminNotification({ name, email, mobile, ...details }),
    ]);

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `Payment email failed (${i === 0 ? "student" : "admin"}):`,
          r.reason,
        );
      }
    });
  } catch (error) {
    console.error("Payment notification error:", error);
  }
}