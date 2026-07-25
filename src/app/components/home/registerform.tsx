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

const schema = yup.object({
  name: yup
    .string()
    .required("Full name is required")
    .matches(/^[A-Za-z ]+$/, "Only alphabets are allowed")
    .min(3, "Name must be at least 3 characters"),

  email: yup
    .string()
    .required("Email address is required")
    .email("Enter a valid email address"),

  mobile: yup
    .string()
    .required("Mobile number is required")
    .matches(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: name === "mobile" ? value.replace(/\D/g, "") : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async () => {
    try {
      await schema.validate(values, {
        abortEarly: false,
      });

      setErrors({
        name: "",
        email: "",
        mobile: "",
      });

      console.log(values);

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

        err.inner.forEach((e) => {
          if (e.path) {
            formErrors[e.path as keyof typeof formErrors] = e.message;
          }
        });

        setErrors(formErrors);
      }
    }
  };

  return (
    <Box
      id="register"
      sx={{
        py: { xs: 3, md: 4 },
        scrollMarginTop: "80px",
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
