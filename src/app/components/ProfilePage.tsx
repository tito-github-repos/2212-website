"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import EmailIcon from "@mui/icons-material/Email";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";

import { auth } from "@/lib/firebase";
import {
  EMPTY_FORM,
  cleanInput,
  deactivateStudentAccount,
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
const CARD = "#141414";
const BORDER = "rgba(255,255,255,0.15)";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";
const DANGER = "#ff6b6b";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="h2"
      sx={{ fontSize: 22, fontWeight: 900, color: TEXT, mt: 3.5, mb: 2 }}
    >
      {children}
    </Typography>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [studentId, setStudentId] = useState("");
  const [docExists, setDocExists] = useState(false);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM); // saved data
  const [draft, setDraft] = useState<FormValues>(EMPTY_FORM); // edit copy
  const [errors, setErrors] = useState<FormErrors>({});

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    let cancelled = false;

    // wait for Firebase to restore the logged-in user
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) setUser(currentUser);

      try {
        const profile = await loadStudentProfile(currentUser);

        if (!cancelled) {
          setStudentId(profile.studentId);
          setDocExists(profile.exists);
          setValues(profile.values);
        }
      } catch (error) {
        console.log("Error getting profile:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const startEdit = () => {
    setDraft(values);
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setErrors({});
    setEditing(false);
  };

  // Runs on every keystroke: cleans the input and validates that field
  const handleChange = (field: FieldName, rawValue: string) => {
    const value = cleanInput(field, rawValue);
    const nextDraft = { ...draft, [field]: value };

    setDraft(nextDraft);
    setErrors((prev) => ({ ...prev, [field]: validateField(field, nextDraft) }));
  };

  const handleSave = async () => {
    if (!user || !studentId) return;

    const cleaned = trimValues(draft);

    // Validate every field again (catches fields the user never touched)
    const nextErrors = validateAll(cleaned);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);

    try {
      await saveStudentProfile(user, studentId, docExists, cleaned);

      setValues(cleaned);
      setDocExists(true);
      setEditing(false);
      setToast({
        open: true,
        message: "Profile updated successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      setToast({
        open: true,
        message: "Could not save changes. Please try again.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteError("");
    setDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!user || !studentId) return;

    setDeleting(true);
    setDeleteError("");

    try {
      // Same as the mobile app: nothing is erased. The account is only
      // marked isActive: false, so support can reactivate it later.
      await deactivateStudentAccount(user, studentId, docExists);

      await signOut(auth);

      router.replace("/practice");
    } catch (error) {
      console.error("Error deleting account:", error);

      const code = (error as { code?: string }).code;

      if (code === "permission-denied") {
        setDeleteError("Not allowed to delete this data. Please contact support.");
      } else {
        setDeleteError("Could not delete the account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

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

  if (!user) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          bgcolor: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontWeight: 700, color: TEXT_SOFT }}>
          Please login to see your profile
        </Typography>
        <Button
          onClick={() => router.push("/practice")}
          sx={{
            height: 48,
            px: 4,
            borderRadius: "24px",
            bgcolor: "#fff",
            color: "#000",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { bgcolor: "#e5e5e5" },
          }}
        >
          Login
        </Button>
      </Box>
    );
  }

  const current = editing ? draft : values;
  const initial = (values.name || user.displayName || user.email || "S")
    .charAt(0)
    .toUpperCase();

  const renderFields = (fields: FieldConfig[]) =>
    fields.map((field) => (
      <ProfileField
        key={field.name}
        placeholder={field.placeholder}
        icon={field.icon}
        value={current[field.name]}
        editable={editing}
        onChange={(value) => handleChange(field.name, value)}
        error={errors[field.name]}
        inputMode={field.inputMode}
        maxLength={field.maxLength}
      />
    ));

  return (
    <Box
      component="main"
      sx={{ minHeight: "100vh", bgcolor: BG, color: TEXT, pb: 6 }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 1.5,
          py: 1.5,
        }}
      >
        <IconButton
          onClick={() => router.push("/maths")}
          aria-label="Back"
          sx={{ position: "absolute", left: 12, color: TEXT }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography sx={{ fontSize: 24, fontWeight: 900, color: TEXT }}>
          My Profile
        </Typography>

        {editing ? (
          <IconButton
            onClick={cancelEdit}
            disabled={saving}
            aria-label="Cancel editing"
            sx={{
              position: "absolute",
              right: 12,
              color: TEXT,
              "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            <CloseIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={startEdit}
            aria-label="Edit profile"
            sx={{ position: "absolute", right: 12, color: TEXT }}
          >
            <EditIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ maxWidth: 1000, mx: "auto", px: 2.5 }}>
        {/* Avatar: white circle with black letter, so it stands out on black */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              bgcolor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 56, fontWeight: 900, color: "#000" }}>
              {initial}
            </Typography>
          </Box>
        </Box>

        {/* One single card. Two columns inside on wide screens, one on phones */}
        <Box
          sx={{
            bgcolor: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: "32px",
            px: { xs: 3, md: 5 },
            pt: 0.5,
            pb: 4,
            mt: 4,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              columnGap: { md: 6 },
              alignItems: "start",
            }}
          >
            {/* Left column: Personal Information */}
            <Box>
              <SectionTitle>Personal Information</SectionTitle>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                {renderFields(PERSONAL_FIELDS)}

                {/* Email always read-only */}
                <ProfileField
                  placeholder="Email"
                  icon={<EmailIcon />}
                  value={user.email ?? ""}
                  editable={false}
                />
              </Box>
            </Box>

            {/* Right column: Academic Details + Location */}
            <Box>
              <SectionTitle>Academic Details</SectionTitle>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                {renderFields(ACADEMIC_FIELDS)}
              </Box>

              <SectionTitle>Location</SectionTitle>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
                {renderFields(LOCATION_FIELDS)}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Save button in edit mode, Delete Account in view mode */}
        <Box sx={{ maxWidth: 420, mx: "auto", mt: 3 }}>
          {editing ? (
            <Button
              onClick={handleSave}
              disabled={saving}
              fullWidth
              endIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <CheckCircleIcon />
                )
              }
              sx={{
                height: 58,
                borderRadius: "20px",
                bgcolor: "#fff",
                color: "#000",
                fontSize: 17,
                fontWeight: 800,
                textTransform: "none",
                "&:hover": { bgcolor: "#e5e5e5" },
                "&.Mui-disabled": {
                  bgcolor: "rgba(255,255,255,0.25)",
                  color: "rgba(255,255,255,0.5)",
                },
              }}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          ) : (
            <Box sx={{ display: "flex", justifyContent: "center", pt: 2 }}>
              <Button
                onClick={openDeleteDialog}
                startIcon={<DeleteIcon />}
                sx={{
                  color: DANGER,
                  fontSize: 18,
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": { bgcolor: "rgba(255,107,107,0.1)" },
                }}
              >
                Delete Account
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Delete confirmation */}
      <Dialog
        open={deleteOpen}
        onClose={closeDeleteDialog}
        slotProps={{
          paper: {
            sx: {
              bgcolor: CARD,
              backgroundImage: "none",
              color: TEXT,
              border: `1px solid ${BORDER}`,
              borderRadius: "24px",
              p: 1,
            },
          },
          backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.75)" } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, color: TEXT }}>
          Delete Account
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: TEXT_SOFT }}>
            Are you sure you want to delete your account?
          </DialogContentText>

          {deleteError && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                bgcolor: "rgba(255,107,107,0.12)",
                color: "#ff8a8a",
                border: "1px solid rgba(255,138,138,0.2)",
                "& .MuiAlert-icon": { color: "#ff8a8a" },
              }}
            >
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={deleting}
            sx={{
              color: TEXT_SOFT,
              fontWeight: 700,
              textTransform: "none",
              "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleDeleteAccount}
            disabled={deleting}
            variant="contained"
            startIcon={
              deleting ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{
              bgcolor: "#e84c3d",
              color: "#fff",
              fontWeight: 700,
              textTransform: "none",
              borderRadius: "12px",
              boxShadow: "none",
              "&:hover": { bgcolor: "#d63f31", boxShadow: "none" },
              "&.Mui-disabled": {
                bgcolor: "rgba(232,76,61,0.4)",
                color: "rgba(255,255,255,0.6)",
              },
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}