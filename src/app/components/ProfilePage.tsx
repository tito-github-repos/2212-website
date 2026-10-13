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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="h2"
      sx={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", mt: 3.5, mb: 2 }}
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
          bgcolor: "#f8f6f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={24} color="inherit" />
        <Typography sx={{ fontWeight: 700, color: "grey.600" }}>
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
          bgcolor: "#f8f6f6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          px: 3,
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontWeight: 700, color: "grey.700" }}>
          Please login to see your profile
        </Typography>
        <Button
          onClick={() => router.push("/practice")}
          sx={{
            height: 48,
            px: 4,
            borderRadius: "24px",
            bgcolor: "#1a1a1a",
            color: "#fff",
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { bgcolor: "#000" },
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
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "#f8f6f6", pb: 6 }}>
      {/* Top bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#f8f6f6",
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
          sx={{ position: "absolute", left: 12 }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#1a1a1a" }}>
          My Profile
        </Typography>

        {editing ? (
          <IconButton
            onClick={cancelEdit}
            disabled={saving}
            aria-label="Cancel editing"
            sx={{ position: "absolute", right: 12 }}
          >
            <CloseIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={startEdit}
            aria-label="Edit profile"
            sx={{ position: "absolute", right: 12 }}
          >
            <EditIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ maxWidth: 1000, mx: "auto", px: 2.5 }}>
        {/* Avatar */}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              background: "linear-gradient(145deg, #1a1a1a, #333333)",
              boxShadow: "0 14px 24px rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>
              {initial}
            </Typography>
          </Box>
        </Box>

        {/* One single card. Two columns inside on wide screens, one on phones */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: "32px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
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
                bgcolor: "#1a1a1a",
                color: "#fff",
                fontSize: 17,
                fontWeight: 800,
                textTransform: "none",
                boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
                "&:hover": { bgcolor: "#000" },
                "&.Mui-disabled": { bgcolor: "#4b5563", color: "#fff" },
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
                  color: "#e84c3d",
                  fontSize: 18,
                  fontWeight: 800,
                  textTransform: "none",
                  "&:hover": { bgcolor: "rgba(232,76,61,0.08)" },
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
        slotProps={{ paper: { sx: { borderRadius: "24px", p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete Account</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account?
          </DialogContentText>

          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={closeDeleteDialog}
            disabled={deleting}
            sx={{
              color: "#1a1a1a",
              fontWeight: 700,
              textTransform: "none",
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