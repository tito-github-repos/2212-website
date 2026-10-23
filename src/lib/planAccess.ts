import { prisma } from "@/lib/prisma";
import type { Product } from "@/generated/prisma";

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