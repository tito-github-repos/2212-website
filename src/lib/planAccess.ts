import { prisma } from "@/lib/prisma";
import { Product } from "@/generated/prisma";
import { getWorksheetWindowEnd } from "@/lib/razorpay";

export type PlanStatus =
  | "NOT_REGISTERED" // no registration for this email
  | "REGISTERED_UNPAID" // registered, has never paid
  | "PAID" // latest paid plan is still active
  | "PLAN_EXPIRED"; // has paid before, but the latest plan has ended

export async function getPlanStatus(
  email: string,
  product: Product,
): Promise<{ status: PlanStatus; validUntil: string | null }> {
  const registration = await prisma.registration.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      payments: {
        where: { product, status: "PAID", validUntil: { not: null } },
        orderBy: { validUntil: "desc" },
        select: { validUntil: true },
        take: 1,
      },
    },
  });

  if (!registration) return { status: "NOT_REGISTERED", validUntil: null };

  const latest = registration.payments[0]?.validUntil ?? null;
  if (!latest) return { status: "REGISTERED_UNPAID", validUntil: null };

  return {
    status: latest > new Date() ? "PAID" : "PLAN_EXPIRED",
    validUntil: latest.toISOString(),
  };
}

// FREE worksheet card: worksheet downloads are free for 1 year after a PAID
// DD Web App or Book payment (paidAt + 12 months). A direct WORKSHEET (₹11)
// payment does NOT count here: that buyer uses the paid card instead.
// The latest end date wins, nothing is stacked.
export async function getFreeWorksheetAccess(
  email: string,
): Promise<{ status: PlanStatus; validUntil: string | null }> {
  const registration = await prisma.registration.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      payments: {
        where: {
          status: "PAID",
          product: { in: [Product.WEBAPP, Product.BOOK] },
        },
        select: { paidAt: true },
      },
    },
  });

  if (!registration) return { status: "NOT_REGISTERED", validUntil: null };

  let latest: Date | null = null;
  for (const p of registration.payments) {
    if (!p.paidAt) continue;
    const end = getWorksheetWindowEnd(p.paidAt);
    if (!latest || end > latest) latest = end;
  }

  if (!latest) return { status: "REGISTERED_UNPAID", validUntil: null };

  return {
    status: latest > new Date() ? "PAID" : "PLAN_EXPIRED",
    validUntil: latest.toISOString(),
  };
}

// ANY worksheet access: a WORKSHEET payment (own validUntil), or a Web App /
// Book payment (paidAt + 12 months). Kept unchanged for other callers.
// The two cards no longer use this: see getFreeWorksheetAccess and
// getPlanStatus(email, Product.WORKSHEET).
export async function getWorksheetAccess(
  email: string,
): Promise<{ status: PlanStatus; validUntil: string | null }> {
  const registration = await prisma.registration.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      payments: {
        where: {
          status: "PAID",
          product: { in: [Product.WORKSHEET, Product.WEBAPP, Product.BOOK] },
        },
        select: { product: true, paidAt: true, validUntil: true },
      },
    },
  });

  if (!registration) return { status: "NOT_REGISTERED", validUntil: null };

  let latest: Date | null = null;
  for (const p of registration.payments) {
    const end =
      p.product === Product.WORKSHEET
        ? p.validUntil
        : p.paidAt
          ? getWorksheetWindowEnd(p.paidAt)
          : null;
    if (end && (!latest || end > latest)) latest = end;
  }

  if (!latest) return { status: "REGISTERED_UNPAID", validUntil: null };

  return {
    status: latest > new Date() ? "PAID" : "PLAN_EXPIRED",
    validUntil: latest.toISOString(),
  };
}