"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailIcon from "@mui/icons-material/Email";

import { auth } from "@/lib/firebase";
import {
  EMPTY_FORM,
  cleanInput,
  loadStudentProfile,
  saveStudentProfile,
  trimValues,
  validateAll,
  validateField,
  type FieldName,
  type FormErrors,
  type FormValues,
} from "@/lib/studentProfile";
import {
  ACADEMIC_FIELDS,
  LOCATION_FIELDS,
  PERSONAL_FIELDS,
  ProfileField,
  type FieldConfig,
} from "./profile/ProfileFields";

/* dark theme colours (same values as globals.css) */
const BG = "#000";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";

// Left column: Name, Email, DOB, Parent Name, Mobile
const LEFT_FIELDS = PERSONAL_FIELDS;

// Right column: Class, School, City, Country
const RIGHT_FIELDS = [...ACADEMIC_FIELDS, ...LOCATION_FIELDS];

export default function CompleteProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    // wait for Firebase to restore the logged-in user
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Not logged in: go to the login page
      if (!currentUser) {
        router.replace("/practice");
        return;
      }

      try {
        const profile = await loadStudentProfile(currentUser);

        // Already registered: nothing to complete
        if (profile.exists) {
          router.replace("/maths");
          return;
        }

        if (!cancelled) {
          setUser(currentUser);
          setStudentId(profile.studentId);
          setValues(profile.values); // name comes from the Google account
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading profile:", error);

        if (!cancelled) {
          setUser(currentUser);
          setSubmitError(
            "Could not load your details. Please refresh and try again.",
          );
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  // Runs on every keystroke: cleans the input and validates that field.
  // "registration" mode: empty optional fields are fine, typed values are checked.
  const handleChange = (field: FieldName, rawValue: string) => {
    const value = cleanInput(field, rawValue);
    const nextValues = { ...values, [field]: value };

    setValues(nextValues);
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, nextValues, "registration"),
    }));
    setSubmitError("");
  };

  const handleSubmit = async () => {
    if (!user || !studentId) {
      setSubmitError(
        "Could not load your details. Please refresh and try again.",
      );
      return;
    }

    const cleaned = trimValues(values);

    // Only the required fields (name) must be filled; typed values must be valid
    const nextErrors = validateAll(cleaned, "registration");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      // exists = false because this is a brand new profile
      await saveStudentProfile(user, studentId, false, cleaned);
      router.replace("/maths");
    } catch (error) {
      console.error("Error saving registration:", error);
      setSubmitError("Could not complete registration. Please try again.");
      setSubmitting(false);
    }
  };

  // Back: sign out so the user is not left half registered
  const handleBack = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
    router.replace("/practice");
  };

  const renderField = (field: FieldConfig) => (
    <ProfileField
      key={field.name}
      appearance="register"
      placeholder={field.placeholder}
      icon={field.icon}
      value={values[field.name]}
      editable
      onChange={(value) => handleChange(field.name, value)}
      error={errors[field.name]}
      inputMode={field.inputMode}
      maxLength={field.maxLength}
    />
  );

  if (loading) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          bgcolor: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={24} sx={{ color: TEXT }} />
        <Typography sx={{ fontWeight: 700, color: TEXT_SOFT }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", bgcolor: BG, color: TEXT, pb: 6 }}
    >
      {/* Back arrow */}
      <Box sx={{ px: 1.5, pt: 1.5 }}>
        <IconButton
          onClick={handleBack}
          disabled={submitting}
          aria-label="Back"
          sx={{ color: TEXT, "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Box>

      <Box sx={{ maxWidth: { xs: 480, md: 900 }, mx: "auto", px: 2.5 }}>
        {/* Title */}
        <Box sx={{ textAlign: "center", mt: 3, mb: 4 }}>
          <Typography
            component="h1"
            sx={{ fontSize: 32, fontWeight: 900, color: TEXT }}
          >
            Complete Your Profile
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 16, color: TEXT_SOFT }}>
            We need a few more details
          </Typography>
        </Box>

        {/* Two columns on wide screens, one column on phones */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: 3,
            rowGap: 2,
            alignItems: "start",
          }}
        >
          {/* Left column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {LEFT_FIELDS.map((field) => (
              <Fragment key={field.name}>
                {renderField(field)}

                {/* Email sits right after the name and cannot be changed */}
                {field.name === "name" && (
                  <ProfileField
                    appearance="register"
                    placeholder="Email"
                    icon={<EmailIcon />}
                    value={user?.email ?? ""}
                    editable={false}
                  />
                )}
              </Fragment>
            ))}
          </Box>

          {/* Right column */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {RIGHT_FIELDS.map((field) => renderField(field))}
          </Box>
        </Box>

        <Box sx={{ maxWidth: 420, mx: "auto" }}>
          {submitError && (
            <Alert
              severity="error"
              sx={{
                mt: 3,
                bgcolor: "rgba(255,107,107,0.12)",
                color: "#ff8a8a",
                border: "1px solid rgba(255,138,138,0.2)",
                "& .MuiAlert-icon": { color: "#ff8a8a" },
              }}
            >
              {submitError}
            </Alert>
          )}

          {/* Submit: white button with black text */}
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            fullWidth
            startIcon={
              submitting ? <CircularProgress size={18} color="inherit" /> : null
            }
            sx={{
              mt: 4,
              height: 58,
              borderRadius: "20px",
              bgcolor: "#fff",
              color: "#000",
              fontSize: 18,
              fontWeight: 800,
              textTransform: "none",
              "&:hover": { bgcolor: "#e5e5e5" },
              "&.Mui-disabled": {
                bgcolor: "rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.5)",
              },
            }}
          >
            {submitting ? "Registering..." : "Complete Registration"}
          </Button>

          <Typography
            sx={{
              mt: 2.5,
              textAlign: "center",
              fontSize: 15,
              fontWeight: 700,
              color: TEXT_SOFT,
            }}
          >
            Register with free subscription
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}