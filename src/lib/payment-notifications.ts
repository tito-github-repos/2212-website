import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { PRODUCT_CONFIG } from "@/lib/razorpay";
import {
  sendPaymentConfirmation,
  sendBookOrderConfirmation,
} from "@/lib/email";

const formatDate = (d: Date) =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

// Sends the confirmation email to the buyer only. No admin emails.
// Never throws: email problems must not affect payment handling.
export async function notifyPaymentSuccess(orderId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
      include: { registration: true, bookOrder: true },
    });

    if (
      !payment ||
      payment.status !== "PAID" ||
      !payment.paidAt ||
      !payment.razorpayPaymentId
    ) {
      return;
    }

    const base = {
      productLabel: PRODUCT_CONFIG[payment.product].label,
      amountText: `₹${(payment.amount / 100).toFixed(2)}`,
      paymentId: payment.razorpayPaymentId,
      paidOn: formatDate(payment.paidAt),
    };

    // ---------- Book order: confirmation to the buyer ----------
    if (payment.product === Product.BOOK) {
      const order = payment.bookOrder;
      if (!order) {
        console.error("Book payment has no bookOrder", { orderId });
        return;
      }

      await sendBookOrderConfirmation({
        name: order.name,
        email: order.email,
        ...base,
        address: order.address,
        city: order.city,
        state: order.state,
        pincode: order.pincode,
      });
      return;
    }

    // ---------- Worksheets + Web App: confirmation to the student ----------
    if (!payment.validUntil) return;

    const { name, email } = payment.registration;

    await sendPaymentConfirmation({
      name,
      email,
      ...base,
      validTill: formatDate(payment.validUntil),
    });
  } catch (error) {
    console.error("Payment notification error:", error);
  }
}