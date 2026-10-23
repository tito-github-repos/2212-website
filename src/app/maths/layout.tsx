import type { ReactNode } from "react";

import PlanGate from "@/app/components/PlanGate";

// Everything under /maths (the test list and every test) needs an active plan
export default function MathsLayout({ children }: { children: ReactNode }) {
  return <PlanGate>{children}</PlanGate>;
}