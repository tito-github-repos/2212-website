"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";

import { auth } from "@/lib/firebase";
import { waitForUser } from "@/lib/questionService";
import {
  PLAN_LINK,
  blockedCopy,
  checkWebAccess,
  type WebAccess,
} from "@/lib/webAccess";

type GateState =
  | { kind: "checking" }
  | { kind: "allowed" }
  | { kind: "blocked"; access: WebAccess }
  | { kind: "error" };

// same dark look as the maths pages
const BG = "#000";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";

function Screen({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: BG,
        color: TEXT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 420, textAlign: "center", alignItems: "center" }}>
        {children}
      </Stack>
    </Box>
  );
}

export default function PlanGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<GateState>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);

  // Runs on first load and again on every page change inside /maths,
  // so an expired plan is noticed even if the student stays signed in.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const user = await waitForUser();

        if (!user) {
          router.replace("/practice");
          return;
        }

        const access = await checkWebAccess(user);
        if (cancelled) return;

        setState(
          access.status === "PAID"
            ? { kind: "allowed" }
            : { kind: "blocked", access },
        );
      } catch (error) {
        console.error("Plan check failed:", error);
        // a network blip must not kick out someone who was already let in
        if (!cancelled) {
          setState((prev) => (prev.kind === "allowed" ? prev : { kind: "error" }));
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [pathname, router, attempt]);

  const switchAccount = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
    router.replace("/practice");
  };

  if (state.kind === "checking") {
    return (
      <Screen>
        <CircularProgress size={28} sx={{ color: TEXT }} />
        <Typography sx={{ fontWeight: 700, color: TEXT_SOFT }}>
          Checking your plan...
        </Typography>
      </Screen>
    );
  }

  if (state.kind === "error") {
    return (
      <Screen>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Something went wrong
        </Typography>
        <Typography sx={{ color: TEXT_SOFT }}>
          We could not check your plan. Please check your internet and try again.
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            setState({ kind: "checking" });
            setAttempt((n) => n + 1);
          }}
          sx={{ bgcolor: "#16a34a", textTransform: "none", fontWeight: 700 }}
        >
          Try again
        </Button>
      </Screen>
    );
  }

  if (state.kind === "blocked") {
    const copy = blockedCopy(state.access);

    return (
      <Screen>
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          {copy.title}
        </Typography>
        <Typography sx={{ color: TEXT_SOFT }}>{copy.text}</Typography>
        <Button
          component={Link}
          href={PLAN_LINK}
          variant="contained"
          sx={{ bgcolor: "#16a34a", textTransform: "none", fontWeight: 700 }}
        >
          {copy.button}
        </Button>
        <Button
          onClick={switchAccount}
          sx={{ color: TEXT_SOFT, textTransform: "none" }}
        >
          Use a different Google account
        </Button>
      </Screen>
    );
  }

  return <>{children}</>;
}