"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Routes where the site header and footer should not appear
const HIDDEN_ROUTES = ["/maths", "/activity", "/profile"];

export function useIsChromeHidden() {
  const pathname = usePathname();

  return HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export default function HideOnRoutes({ children }: { children: ReactNode }) {
  const hidden = useIsChromeHidden();

  if (hidden) return null;

  return <>{children}</>;
}
