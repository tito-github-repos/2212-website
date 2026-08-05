"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import * as yup from "yup";

import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Turnstile from "react-turnstile";

const isRepeatedDigits = (value: string) => /^(\d)\1{9}$/.test(value);

const isSequential = (value: string) => {
  const ascending = "01234567890123456789"; // covers wrap-around sequences
  const descending = "98765432109876543210";
  return ascending.includes(value) || descending.includes(value);
};

const schema = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .matches(/^[A-Za-z ]+$/, "Only alphabets are allowed")
    .min(3, "Name must be at least 3 characters"),

  email: yup
    .string()
    .required("Email address is required")
    .matches(
      /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/,
      "Enter a valid email address"
    ),

  mobile: yup
  .string()
  .required("Mobile number is required")
  .matches(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number")
  .test(
    "no-repeated-digits",
    "Mobile number cannot be all the same digit",
    (value) => !value || !isRepeatedDigits(value)
  )
  .test(
    "no-sequential-digits",
    "Mobile number cannot be a sequential number",
    (value) => !value || !isSequential(value)
  ),
});

export default function RegisterSection() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    mobile: "",
  });

  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [website, setWebsite] = useState("");
  const [formStartedAt] = useState(Date.now());

  const validateField = async (
    field: keyof typeof values,
    updatedValues: typeof values
  ) => {
    try {
      await schema.validateAt(field, updatedValues);
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setErrors((prev) => ({ ...prev, [field]: err.message }));
      }
    }
  };

 
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const nextValue =
      name === "mobile" ? value.replace(/\D/g, "").slice(0, 10) : value;

    const updatedValues = { ...values, [name]: nextValue };
    setValues(updatedValues);
    validateField(name as keyof typeof values, updatedValues);
  };

  const handleSubmit = async () => {
    try {
      // Reset previous success message
      setSuccess(false);

      // Validate form
      await schema.validate(values, {
        abortEarly: false,
      });
      if (!turnstileToken) {
        alert("Please complete verification.");
        return;
      }

      // Clear validation errors
      setErrors({
        name: "",
        email: "",
        mobile: "",
      });

      // Call API E:\2212-website-tito-github\2212-website\src\app\api\registration
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          website,
          formStartedAt,
          turnstileToken,
        }),
      });

      const result = await response.json();

      // Handle API errors
      if (!response.ok) {
        alert(result.message || "Registration failed.");
        return;
      }

      // Success
      setSuccess(true);

      setValues({
        name: "",
        email: "",
        mobile: "",
      });
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const formErrors = {
          name: "",
          email: "",
          mobile: "",
        };

        err.inner.forEach((error) => {
          if (error.path) {
            formErrors[error.path as keyof typeof formErrors] = error.message;
          }
        });

        setErrors(formErrors);
      } else {
        console.error(err);
        alert("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <Box
      id="register"
      sx={{
        py: { xs: 3, md: 4 },
        scrollMarginTop: "80px",
        backgroundColor: "var(--white)",
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            background:
              "linear-gradient(90deg,#F1FFF5 0%,#F8FFF9 60%,#FFFFFF 100%)",
            borderRadius: "22px",
            px: { xs: 2, sm: 4, md: 4 },
            py: { xs: 4, md: 3 },
            overflow: "hidden",
          }}
        >
          <Grid
            container
            spacing={{ xs: 5, md: 6 }}
            sx={{ alignItems: "center" }}
          >
            {/* LEFT SIDE */}

            <Grid size={{ xs: 12, md: 4 }}>
              <Stack
                spacing={2}
                sx={{
                  alignItems: {
                    xs: "center",
                    md: "flex-start",
                  },
                  textAlign: {
                    xs: "center",
                    md: "left",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: "#111827",
                    lineHeight: 1.2,
                    fontSize: {
                      xs: "2rem",
                      md: "2.6rem",
                    },
                  }}
                >
                  Register Here
                </Typography>

                <Typography
                  sx={{
                    color: "#5B6470",
                    fontSize: "1.1rem",
                    maxWidth: 330,
                  }}
                >
                  Start your learning journey today and sharpen your mind with
                  practice, tests and daily challenges.
                </Typography>

                <Image
                  src="/img/home/register.webp"
                  alt="Register"
                  width={340}
                  height={340}
                  style={{
                    width: "100%",
                    maxWidth: "320px",
                    height: "auto",
                    marginTop: "10px",
                  }}
                />
              </Stack>
            </Grid>

            {/* RIGHT SIDE */}

            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={2.5}>
                {success && (
                  <Alert severity="success">
                    Registration submitted successfully.
                  </Alert>
                )}

                {/* Full Name */}

                <Box>
                  <Typography
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Full Name
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="Enter your full name"
                    name="name"
                    value={values.name}
                    onChange={handleChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: "12px",
                        height: 58,

                        "& fieldset": {
                          borderColor: "#E5E7EB",
                        },

                        "&:hover fieldset": {
                          borderColor: "#16A34A",
                        },

                        "&.Mui-focused fieldset": {
                          borderWidth: 2,
                          borderColor: "#16A34A",
                        },
                      },
                    }}
                  />
                </Box>
                {/* Email Address */}

                <Box>
                  <Typography
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Email Address
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="Enter your email address"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: "12px",
                        height: 58,

                        "& fieldset": {
                          borderColor: "#E5E7EB",
                        },

                        "&:hover fieldset": {
                          borderColor: "#16A34A",
                        },

                        "&.Mui-focused fieldset": {
                          borderWidth: 2,
                          borderColor: "#16A34A",
                        },
                      },
                    }}
                  />
                </Box>

                {/* Mobile Number */}

                <Box>
                  <Typography
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Mobile Number
                  </Typography>

                  <TextField
                    fullWidth
                    placeholder="Enter your mobile number"
                    name="mobile"
                    value={values.mobile}
                    onChange={handleChange}
                    error={!!errors.mobile}
                    helperText={errors.mobile}
                    slotProps={{
                      htmlInput: {
                        maxLength: 10,
                        inputMode: "numeric",
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#fff",
                        borderRadius: "12px",
                        height: 58,

                        "& fieldset": {
                          borderColor: "#E5E7EB",
                        },

                        "&:hover fieldset": {
                          borderColor: "#16A34A",
                        },

                        "&.Mui-focused fieldset": {
                          borderWidth: 2,
                          borderColor: "#16A34A",
                        },
                      },
                    }}
                  />
                </Box>

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
                    width: "1px",
                    height: "1px",
                    opacity: 0,
                  }}
                />

                <Turnstile
                  sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || ""}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                />

                {/* Register Button */}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubmit}
                  sx={{
                    mt: 2,
                    height: 58,
                    borderRadius: "12px",
                    backgroundColor: "#16A34A",
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    boxShadow: "0 10px 24px rgba(22,163,74,.25)",

                    "&:hover": {
                      backgroundColor: "#15803D",
                    },
                  }}
                >
                  Register Now
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}

