import { prisma } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

// How long an unpaid order can be reused. After this it counts as abandoned
// (EXPIRED) and the next click on "Pay" starts a fresh order.
export const UNPAID_WINDOW_MS = 1 * DAY_MS;

// Delivery addresses of unpaid book orders are removed after this long.
// Razorpay can confirm a slow payment up to about 5 days late, so this leaves a buffer.
const ADDRESS_KEEP_MS = 14 * DAY_MS;

// CREATED -> EXPIRED for abandoned checkouts.
// Safe if a payment arrives later: the webhook turns any non-PAID row into PAID.
export async function expireStalePayments() {
  try {
    await prisma.payment.updateMany({
      where: {
        status: "CREATED",
        createdAt: { lt: new Date(Date.now() - UNPAID_WINDOW_MS) },
      },
      data: { status: "EXPIRED" },
    });
  } catch (error) {
    console.error("Expire stale payments error:", error);
  }
}

// Privacy: remove addresses of people who never paid. The payment row stays.
export async function purgeUnpaidBookAddresses() {
  try {
    await prisma.bookOrder.deleteMany({
      where: {
        createdAt: { lt: new Date(Date.now() - ADDRESS_KEEP_MS) },
        payment: { status: { not: "PAID" } },
      },
    });
  } catch (error) {
    console.error("Purge unpaid book addresses error:", error);
  }
}