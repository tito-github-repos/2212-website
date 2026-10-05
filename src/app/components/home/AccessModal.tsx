"use client";

import { useRef, useState } from "react";
import NextLink from "next/link";
import * as yup from "yup";
import Turnstile from "react-turnstile";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export type Product = "WORKSHEET" | "COMPETITION";
type Step = "email" | "register" | "unpaid" | "paid" | "success";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: (response: unknown) => void) => void;
    };
  }
}

const PRODUCT_INFO: Record<Product, { label: string; price: string }> = {
  WORKSHEET: { label: "Worksheet Download", price: "₹222" },
  COMPETITION: { label: "Competitions", price: "₹777" },
};

// TODO: replace with the real team details
const TEAM_CONTACT = {
  phone: "+91 00000 00000",
  email: "support@2212.co.in",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const isRepeatedDigits = (v: string) => /^(\d)\1{9}$/.test(v);
const isSequential = (v: string) =>
  "01234567890123456789".includes(v) || "98765432109876543210".includes(v);

const registerSchema = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .matches(/^[A-Za-z ]+$/, "Only alphabets are allowed")
    .min(3, "Name must be at least 3 characters"),
  mobile: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number")
    .test(
      "repeat",
      "Mobile number cannot be all the same digit",
      (v) => !v || !isRepeatedDigits(v),
    )
    .test(
      "seq",
      "Mobile number cannot be a sequential number",
      (v) => !v || !isSequential(v),
    ),
});

const emailSchema = yup
  .string()
  .required("Email address is required")
  .max(120, "Email is too long")
  .matches(emailRegex, "Enter a valid email address");

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    "& fieldset": { borderColor: "#E5E7EB" },
    "&:hover fieldset": { borderColor: "#16A34A" },
    "&.Mui-focused fieldset": { borderWidth: 2, borderColor: "#16A34A" },
  },
};

const primaryBtnSx = {
  height: 50,
  borderRadius: "12px",
  backgroundColor: "#16A34A",
  textTransform: "none",
  fontWeight: 700,
  "&:hover": { backgroundColor: "#15803D" },
};

const loadRazorpay = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

type Props = {
  product: Product;
  onClose: () => void;
};

export default function AccessModal({ product, onClose }: Props) {
  const info = PRODUCT_INFO[product];

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState({ email: "", name: "", mobile: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const formStartedAt = useRef(Date.now());

  // Turnstile tokens are single-use: clear and remount the widget for a fresh one
  const resetTurnstile = () => {
    setToken("");
    setTurnstileKey((k) => k + 1);
  };

  const normalizedEmail = email.trim().toLowerCase();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    try {
      emailSchema.validateSync(value.trim());
      setErrors((p) => ({ ...p, email: "" }));
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors((p) => ({ ...p, email: err.message }));
      }
    }
  };

  const validateRegisterField = (
    field: "name" | "mobile",
    values: { name: string; mobile: string },
  ) => {
    try {
      registerSchema.validateSyncAt(field, values);
      setErrors((p) => ({ ...p, [field]: "" }));
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors((p) => ({ ...p, [field]: err.message }));
      }
    }
  };

  const handleNameChange = (value: string) => {
    setName(value);
    validateRegisterField("name", { name: value.trim(), mobile });
  };

  const handleMobileChange = (value: string) => {
    const next = value.replace(/\D/g, "").slice(0, 10);
    setMobile(next);
    validateRegisterField("mobile", { name: name.trim(), mobile: next });
  };

  const handleCheck = async () => {
    setMessage("");

    try {
      emailSchema.validateSync(normalizedEmail);
      setErrors((p) => ({ ...p, email: "" }));
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors((p) => ({ ...p, email: err.message }));
      }
      return;
    }

    if (!token) {
      setMessage("Please complete the verification.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/access/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          product,
          turnstileToken: token,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        setMessage(result.message || "Something went wrong. Please try again.");
        resetTurnstile();
        return;
      }

      setToken("");
      if (result.status === "NOT_REGISTERED") {
        formStartedAt.current = Date.now();
        setStep("register");
      } else if (result.status === "PAID") {
        setStep("paid");
      } else {
        setStep("unpaid");
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setMessage("");

    try {
      await registerSchema.validate(
        { name: name.trim(), mobile },
        { abortEarly: false },
      );
      setErrors((p) => ({ ...p, name: "", mobile: "" }));
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const next = { email: "", name: "", mobile: "" };
        err.inner.forEach((e) => {
          if (e.path === "name" || e.path === "mobile")
            next[e.path] = e.message;
        });
        setErrors(next);
      }
      return;
    }

    if (!token) {
      setMessage("Please complete the verification.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: normalizedEmail,
          mobile,
          website,
          formStartedAt: formStartedAt.current,
          turnstileToken: token,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        setMessage(result.message || "Registration failed. Please try again.");
        resetTurnstile();
        return;
      }

      setToken("");
      setStep("unpaid");
    } catch {
      setMessage("Something went wrong. Please try again.");
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setMessage("");
    setLoading(true);

    try {
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        setMessage(
          "Could not load the payment window. Check your connection and try again.",
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, product }),
      });
      const order = await res.json();

      if (!res.ok || !order.success) {
        if (res.status === 409) {
          setStep("paid");
        } else {
          setMessage(
            order.message || "Could not start the payment. Please try again.",
          );
        }
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "2212",
        description: info.label,
        order_id: order.orderId,
        prefill: { email: normalizedEmail },
        theme: { color: "#16A34A" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyResult = await verifyRes.json();

            if (verifyRes.ok && verifyResult.success) {
              setStep("success");
            } else {
              setMessage(
                "We received your payment but could not confirm it yet. It will be updated shortly. If not, please contact our team.",
              );
            }
          } catch {
            setMessage(
              "We received your payment but could not confirm it yet. It will be updated shortly. If not, please contact our team.",
            );
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });

      rzp.on("payment.failed", () => {
        setMessage("Payment failed. You can try again.");
        setLoading(false);
      });

      // loading stays true while the Razorpay window is open
      rzp.open();
    } catch {
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const turnstile = (
    <Turnstile
      key={`${step}-${turnstileKey}`}
      sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ""}
      onVerify={(t) => setToken(t)}
      onExpire={() => setToken("")}
      onError={() => setToken("")}
    />
  );

  return (
    <Dialog
      open
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: "20px" } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {info.label}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={loading}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {message && (
            <Alert
              severity={
                step === "unpaid" && message.startsWith("We received")
                  ? "warning"
                  : "error"
              }
            >
              {message}
            </Alert>
          )}

          {/* STEP 1: email */}
          {step === "email" && (
            <>
              <Typography sx={{ color: "#5B6470" }}>
                Enter your email to continue.
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                sx={fieldSx}
              />
              {turnstile}
              <Button
                fullWidth
                variant="contained"
                onClick={handleCheck}
                disabled={loading}
                sx={primaryBtnSx}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Continue"
                )}
              </Button>
            </>
          )}

          {/* STEP 2a: not registered */}
          {step === "register" && (
            <>
              <Typography sx={{ color: "#5B6470" }}>
                You&apos;re not registered yet. Please register to continue.
              </Typography>
              <TextField
                fullWidth
                value={normalizedEmail}
                disabled
                sx={fieldSx}
              />
              <TextField
                fullWidth
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={fieldSx}
              />
              <TextField
                fullWidth
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => handleMobileChange(e.target.value)}

                error={!!errors.mobile}
                helperText={errors.mobile}
                slotProps={{
                  htmlInput: { maxLength: 10, inputMode: "numeric" },
                }}
                sx={fieldSx}
              />
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: 1,
                  height: 1,
                  opacity: 0,
                }}
              />
              {turnstile}
              <Button
                fullWidth
                variant="contained"
                onClick={handleRegister}
                disabled={loading}
                sx={primaryBtnSx}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Register & Continue"
                )}
              </Button>
              <Button
                onClick={() => {
                  setMessage("");
                  resetTurnstile();
                  setStep("email");
                }}
                disabled={loading}
                sx={{ textTransform: "none", color: "#5B6470" }}
              >
                Use a different email
              </Button>
            </>
          )}

          {/* STEP 2b: registered, not paid */}
          {step === "unpaid" && (
            <>
              <Stack
                spacing={1}
                sx={{ alignItems: "center", textAlign: "center" }}
              >
                <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 48 }} />
                <Typography sx={{ fontWeight: 700 }}>
                  You&apos;re registered
                </Typography>
                <Typography sx={{ color: "#5B6470" }}>
                  Continue to pay {info.price} / year for {info.label}.
                </Typography>
              </Stack>
              <Button
                fullWidth
                variant="contained"
                onClick={handlePay}
                disabled={loading}
                sx={primaryBtnSx}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  `Proceed to Pay ${info.price}`
                )}
              </Button>
            </>
          )}

          {/* STEP 2c: already paid */}
          {step === "paid" && (
            <>
              <Stack
                spacing={1}
                sx={{ alignItems: "center", textAlign: "center" }}
              >
                <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 48 }} />
                <Typography sx={{ fontWeight: 700 }}>
                  You&apos;ve already paid for {info.label}
                </Typography>
                <Typography sx={{ color: "#5B6470" }}>
                  Please contact our team for access or any help.
                </Typography>
              </Stack>
              <Box sx={{ bgcolor: "#F4FAF9", borderRadius: "12px", p: 2 }}>
                <Typography variant="body2">
                  Phone: {TEAM_CONTACT.phone}
                </Typography>
                <Typography variant="body2">
                  Email: {TEAM_CONTACT.email}
                </Typography>
                <Typography variant="body2">
                  Or visit our{" "}
                  <Box
                    component={NextLink}
                    href="/contact"
                    sx={{ color: "#16A34A", fontWeight: 700 }}
                  >
                    contact page
                  </Box>
                  .
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={onClose}
                sx={{
                  ...primaryBtnSx,
                  backgroundColor: "transparent",
                  color: "#16A34A",
                  "&:hover": { backgroundColor: "#F1FFF5" },
                }}
              >
                Close
              </Button>
            </>
          )}

          {/* STEP 3: payment just completed */}
          {step === "success" && (
            <>
              <Stack
                spacing={1}
                sx={{ alignItems: "center", textAlign: "center" }}
              >
                <CheckCircleIcon sx={{ color: "#16A34A", fontSize: 56 }} />
                <Typography sx={{ fontWeight: 700 }}>
                  Payment successful
                </Typography>
                <Typography sx={{ color: "#5B6470" }}>
                  Thank you! Your payment for {info.label} is confirmed. Our
                  team will get in touch with you.
                </Typography>
              </Stack>
              <Button
                fullWidth
                variant="contained"
                onClick={onClose}
                sx={primaryBtnSx}
              >
                Done
              </Button>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
