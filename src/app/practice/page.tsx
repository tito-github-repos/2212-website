"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { auth, loginWithGoogle } from "@/lib/firebase";
import { loadStudentProfile } from "@/lib/studentProfile";

// Turns a Firebase error code into a message the user can act on.
// Returns "" when nothing should be shown (the user just closed the popup).
function getLoginErrorMessage(code?: string) {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";

    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Please allow popups for this site and try again.";

    case "auth/unauthorized-domain":
      return "This website address is not authorised in Firebase (auth/unauthorized-domain).";

    case "auth/network-request-failed":
      return "Network problem. Check your internet, turn off any VPN or ad blocker and try again (auth/network-request-failed).";

    case "auth/internal-error":
      return "Sign-in could not start. A security setting or ad blocker may be blocking Google (auth/internal-error).";

    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this app (auth/operation-not-allowed).";

    default:
      return `Login failed (${code ?? "unknown error"}). Please try again.`;
  }
}

export default function PracticeLoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deactivated, setDeactivated] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage("");
    setDeactivated(false);

    let destination = "";

    try {
      const credential = await loginWithGoogle();

      try {
        const profile = await loadStudentProfile(credential.user);

        if (profile.deactivated) {
          // Deleted account: do not let it in
          await signOut(auth);
          setDeactivated(true);
        } else {
          // First-time users have no profile yet, so they register first
          destination = profile.exists ? "/maths" : "/complete-profile";
        }
      } catch (profileError) {
        console.error("Error checking profile:", profileError);
        setErrorMessage(
          "Signed in, but we could not check your profile. Please try again.",
        );

        // Start clean so the next try runs the check again
        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("Sign out failed:", signOutError);
        }
      }
    } catch (error) {
      console.error("Google login error:", error);

      const code = (error as { code?: string }).code;
      setErrorMessage(getLoginErrorMessage(code));
    }

    if (destination) {
      router.push(destination);
    } else {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
      }}
    >
      <Container maxWidth="xs" sx={{ textAlign: "center" }}>
        {/* <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Box
            sx={{
              width: 112,
              height: 112,
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <Image
              src="/img/practice/app_logo.jpeg"
              alt="TikoKids"
              width={112}
              height={112}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </Box>
        </Box> */}

        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 700, color: "#16a34a" }}
        >
          Welcome!
        </Typography>

        <Typography sx={{ mt: 1.5, fontSize: 18, color: "#6b7280" }}>
          Let&apos;s start learning together
        </Typography>

        <Typography
          sx={{ mt: 6, fontSize: 16, fontWeight: 600, color: "#6b7280" }}
        >
          Sign in to continue
        </Typography>

        <Button
          onClick={handleGoogleLogin}
          disabled={loading}
          fullWidth
          sx={{
            height: 56,
            mt: 4,
            borderRadius: 4,
            bgcolor: "#fff",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
            textTransform: "none",
            "&:hover": { bgcolor: "#f9fafb" },
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "#16a34a" }} />
          ) : (
            <Image
              src="/img/practice/download.svg"
              alt="Google"
              width={24}
              height={24}
            />
          )}
          <Typography sx={{ color: "#16a34a", fontWeight: 700 }}>
            {loading ? "Signing in..." : "Continue with Google"}
          </Typography>
        </Button>

        {deactivated && (
          <Alert
            severity="error"
            variant="filled"
            sx={{ mt: 2, textAlign: "left", borderRadius: "16px" }}
          >
            <AlertTitle sx={{ fontWeight: 800 }}>Account Deactivated</AlertTitle>
            This account has been deactivated. Please contact with support team
          </Alert>
        )}

        {errorMessage && (
          <Alert severity="error" sx={{ mt: 2, textAlign: "left" }}>
            {errorMessage}
          </Alert>
        )}

        {/* <Button
          onClick={() => router.push("/maths")}
          disabled={loading}
          sx={{
            mt: 3,
            color: "#16a34a",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Continue as Guest
        </Button> */}

        <Typography sx={{ mt: 6, fontSize: 12, color: "#9ca3af" }}>
          By continuing, you agree to our Terms of Service
          <br />
          and Privacy Policy
        </Typography>
      </Container>
    </Box>
  );
}