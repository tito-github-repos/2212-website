'use client';

import type { ReactNode } from "react";
import { useIsChromeHidden } from "./HideOnRoutes";

export default function MainContent({ children }: { children: ReactNode }) {
  const hidden = useIsChromeHidden();

    return (
        <main style={{ paddingTop: hidden ? 0 : "60px" }}>{children}</main>
    );
}