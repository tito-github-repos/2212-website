"use client";

import { useRef, useState } from "react";
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

// Display only. The server is the source of truth for the amount.
export const BOOK_PRICE = "₹222";

type Step = "form" | "success";

type FormValues = {
  name: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

const emptyValues: FormValues = {
  name: "",
  email: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const isRepeatedDigits = (v: string) => /^(\d)\1{9}$/.test(v);
const isSequential = (v: string) =>
  "01234567890123456789".includes(v) || "98765432109876543210".includes(v);

const bookSchema = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .matches(/^[A-Za-z ]+$/, "Only alphabets are allowed")
    .min(3, "Name must be at least 3 characters"),
  email: yup
    .string()
    .required("Email address is required")
    .max(120, "Email is too long")
    .matches(emailRegex, "Enter a valid email address"),
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
  address: yup
    .string()
    .required("Delivery address is required")
    .min(10, "Please enter the full address (house no., street, area)")
    .max(200, "Address is too long"),
  city: yup
    .string()
    .required("City is required")
    .matches(/^[A-Za-z .]+$/, "Only alphabets are allowed")
    .min(2, "Enter a valid city")
    .max(60, "City name is too long"),
  state: yup
    .string()
    .required("State is required")
    .matches(/^[A-Za-z .]+$/, "Only alphabets are allowed")
    .min(2, "Enter a valid state")
    .max(60, "State name is too long"),
  pincode: yup
    .string()
    .required("Pincode is required")
    .matches(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

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

const trimValues = (v: FormValues): FormValues => ({
  name: v.name.trim(),
  email: v.email.trim().toLowerCase(),
  mobile: v.mobile,
  address: v.address.trim(),
  city: v.city.trim(),
  state: v.state.trim(),
  pincode: v.pincode,
});

type Props = {
  onClose: () => void;
};

export default function BookOrderModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Record<keyof FormValues, string>>({
    name: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [website, setWebsite] = useState(""); // honeypot
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

  const validateField = (field: keyof FormValues, next: FormValues) => {
    try {
      bookSchema.validateSyncAt(field, trimValues(next));
      return "";
    } catch (err) {
      return err instanceof yup.ValidationError ? err.message : "";
    }
  };

  const handleChange = (field: keyof FormValues, raw: string) => {
    let value = raw;
    if (field === "mobile") value = raw.replace(/\D/g, "").slice(0, 10);
    if (field === "pincode") value = raw.replace(/\D/g, "").slice(0, 6);

    const next = { ...values, [field]: value };
    setValues(next);
    setErrors((p) => ({ ...p, [field]: validateField(field, next) }));
  };

  const handlePay = async () => {
    setMessage("");

    const clean = trimValues(values);
    try {
      await bookSchema.validate(clean, { abortEarly: false });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const next = {
          name: "",
          email: "",
          mobile: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
        };
        err.inner.forEach((e) => {
          if (e.path && e.path in next) {
            const key = e.path as keyof FormValues;
            if (!next[key]) next[key] = e.message;
          }
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
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        setMessage(
          "Could not load the payment window. Check your connection and try again.",
        );
        setLoading(false);
        return;
      }

      const res = await fetch("/api/book-orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clean,
          website,
          formStartedAt: formStartedAt.current,
          turnstileToken: token,
        }),
      });
      const order = await res.json();

      // The Turnstile token is consumed by the create call
      resetTurnstile();

      if (!res.ok || !order.success) {
        setMessage(
          order.message || "Could not start the payment. Please try again.",
        );
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "2212",
        description: "2212 Book (1 copy)",
        order_id: order.orderId,
        prefill: {
          name: clean.name,
          email: clean.email,
          contact: clean.mobile,
        },
        theme: { color: "#16A34A" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/book-orders/verify", {
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
      resetTurnstile();
      setLoading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      slotProps={{ paper: { sx: { borderRadius: "20px" } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pr: 6 }}>
        {step === "form" ? "Order the 2212 Book" : "Order confirmed"}
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
              severity={message.startsWith("We received") ? "warning" : "error"}
            >
              {message}
            </Alert>
          )}

          {step === "form" && (
            <>
              <Typography sx={{ color: "#5B6470" }}>
                Enter your delivery details. One copy of the book will be
                delivered to this address. Price: {BOOK_PRICE}.
              </Typography>

              <TextField
                fullWidth
                label="Full name"
                value={values.name}
                onChange={(e) => handleChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                type="email"
                label="Email address"
                value={values.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                label="Mobile number"
                value={values.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
                error={!!errors.mobile}
                helperText={errors.mobile}
                slotProps={{
                  htmlInput: { maxLength: 10, inputMode: "numeric" },
                }}
                sx={fieldSx}
              />

              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Delivery address"
                placeholder="House / flat no., street, area, landmark"
                value={values.address}
                onChange={(e) => handleChange("address", e.target.value)}
                error={!!errors.address}
                helperText={errors.address}
                sx={fieldSx}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2.5,
                }}
              >
                <TextField
                  fullWidth
                  label="City"
                  value={values.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  error={!!errors.city}
                  helperText={errors.city}
                  sx={fieldSx}
                />
                <TextField
                  fullWidth
                  label="State"
                  value={values.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  error={!!errors.state}
                  helperText={errors.state}
                  sx={fieldSx}
                />
              </Box>

              <TextField
                fullWidth
                label="Pincode"
                value={values.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                error={!!errors.pincode}
                helperText={errors.pincode}
                slotProps={{
                  htmlInput: { maxLength: 6, inputMode: "numeric" },
                }}
                sx={fieldSx}
              />

              {/* Honeypot */}
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

              <Turnstile
                key={turnstileKey}
                sitekey={
                  process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ""
                }
                onVerify={(t) => setToken(t)}
                onExpire={() => setToken("")}
                onError={() => setToken("")}
              />

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
                  `Proceed to Pay ${BOOK_PRICE}`
                )}
              </Button>
            </>
          )}

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
                  Thank you! Your order for the 2212 Book is confirmed. One copy
                  will be delivered to the address you entered.
                </Typography>
              </Stack>

              <Box sx={{ bgcolor: "#F4FAF9", borderRadius: "12px", p: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Delivering to
                </Typography>
                <Typography variant="body2">
                  {values.name.trim()}, {values.address.trim()},{" "}
                  {values.city.trim()}, {values.state.trim()} -{" "}
                  {values.pincode}
                </Typography>
              </Box>

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