import type { User } from "firebase/auth";

export type WebAccessStatus =
  | "NOT_REGISTERED"
  | "REGISTERED_UNPAID"
  | "PAID"
  | "PLAN_EXPIRED";

export type WebAccess = {
  status: WebAccessStatus;
  validUntil: string | null;
  email: string;
};

// Where the "Get plan / Renew" button takes the student
// export const PLAN_LINK = "/#premium-resources";
export const PLAN_LINK = "/#banner-webapp";

// Asks our server whether this signed-in student has an active plan.
// The server verifies the sign-in token, so this can't be faked from the browser.
export async function checkWebAccess(user: User): Promise<WebAccess> {
  const token = await user.getIdToken();

  const res = await fetch("/api/access/web", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Could not check your plan");
  }

  return {
    status: data.status as WebAccessStatus,
    validUntil: typeof data.validUntil === "string" ? data.validUntil : null,
    email: String(data.email ?? ""),
  };
}

function formatPlanDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

// What to tell a student whose plan is not active
export function blockedCopy(access: WebAccess) {
  if (access.status === "PLAN_EXPIRED") {
    return {
      title: "Your plan has expired",
      text: access.validUntil
        ? `Your plan ended on ${formatPlanDate(access.validUntil)}. Renew it to continue practising.`
        : "Renew your plan to continue practising.",
      button: "Renew plan",
    };
  }

  return {
    title: "No active plan found",
    text: `We could not find a paid plan for ${access.email}. Please pay using the same email you sign in with on Google.`,
    button: "Get Worksheets & App",
  };
}