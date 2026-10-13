"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as yup from "yup";
import {
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
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
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import CakeIcon from "@mui/icons-material/Cake";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PublicIcon from "@mui/icons-material/Public";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";

import { auth, db } from "@/lib/firebase";

type FormValues = {
  name: string;
  dob: string;
  parentName: string;
  mobile: string;
  className: string;
  schoolName: string;
  city: string;
  country: string;
};

type FieldName = keyof FormValues;

// Maps each form field to its field name in the StudentRegister document.
// If your mobile app uses different names, change ONLY the right-hand side.
const FIELD_KEYS: Record<FieldName, string> = {
  name: "name",
  dob: "dob",
  parentName: "parentName",
  mobile: "mobile",
  className: "class",
  schoolName: "schoolName",
  city: "city",
  country: "country",
};

const EMPTY_FORM: FormValues = {
  name: "",
  dob: "",
  parentName: "",
  mobile: "",
  className: "",
  schoolName: "",
  city: "",
  country: "India",
};

type FieldConfig = {
  name: FieldName;
  placeholder: string;
  icon: ReactNode;
  inputMode?: "numeric" | "text";
  maxLength?: number;
};

const PERSONAL_FIELDS: FieldConfig[] = [
  { name: "name", placeholder: "Name", icon: <PersonIcon /> },
  {
    name: "dob",
    placeholder: "Date of Birth (DD/MM/YYYY)",
    icon: <CakeIcon />,
    inputMode: "numeric",
    maxLength: 10,
  },
  {
    name: "parentName",
    placeholder: "Parent Name",
    icon: <FamilyRestroomIcon />,
  },
  {
    name: "mobile",
    placeholder: "Mobile Number",
    icon: <PhoneIcon />,
    inputMode: "numeric",
    maxLength: 10,
  },
];

const ACADEMIC_FIELDS: FieldConfig[] = [
  { name: "className", placeholder: "Class", icon: <SchoolIcon /> },
  {
    name: "schoolName",
    placeholder: "School Name",
    icon: <AccountBalanceIcon />,
  },
];

const LOCATION_FIELDS: FieldConfig[] = [
  { name: "city", placeholder: "City", icon: <LocationCityIcon /> },
  { name: "country", placeholder: "Country", icon: <PublicIcon /> },
];

// ---------- validation (Yup) ----------

// Allowed age range for the date of birth (change if needed)
const MIN_AGE = 3;
const MAX_AGE = 100;

// Letters in any language (e.g. Tamil), spaces, dot, apostrophe, hyphen
const NAME_PATTERN = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M}\\s.'-]*$", "u");
// Letters, digits, spaces and common school name symbols
const SCHOOL_PATTERN = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s.,'&()/-]+$", "u");
// Letters, digits, spaces, dot, hyphen (e.g. "Pre-KG", "B.Sc", "2nd year")
const CLASS_PATTERN = new RegExp("^[\\p{L}\\p{M}\\p{N}\\s.-]+$", "u");
const LETTER = new RegExp("\\p{L}", "u");

const CLASS_HINT =
  "Enter a valid class (e.g. Pre KG, LKG, UKG, 1 to 12, College)";

// true when the same character appears `times` or more in a row
// e.g. "aaaa" or "9999999"
function hasRepeat(value: string, times: number) {
  let count = 1;

  for (let i = 1; i < value.length; i++) {
    count = value[i] === value[i - 1] ? count + 1 : 1;
    if (count >= times) return true;
  }

  return false;
}

// the different letters used in a text, e.g. "Anna" -> a, n
function letterSet(value: string) {
  return new Set(
    Array.from(value.toLowerCase()).filter((char) => LETTER.test(char)),
  );
}

// true for digits that go straight up or down: 1234567890, 9876543210
function isSequential(digits: string) {
  const steps = new Set<number>();

  for (let i = 1; i < digits.length; i++) {
    steps.add((Number(digits[i]) - Number(digits[i - 1]) + 10) % 10);
  }

  return steps.size === 1 && (steps.has(1) || steps.has(9));
}

// Each check returns an error message, or null when the value is fine.
// Empty values return null here because "required" handles them.

function checkLetters(value: string, label: string, maxLength: number) {
  if (!value) return null;

  if (!NAME_PATTERN.test(value)) return `${label} can contain only letters`;

  if (letterSet(value).size < 2 || hasRepeat(value.toLowerCase(), 4)) {
    return `Enter a valid ${label.toLowerCase()}`;
  }

  if (value.length > maxLength) return `${label} is too long`;

  return null;
}

function checkDob(value: string) {
  if (!value) return null;

  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return "Enter the date as DD/MM/YYYY";

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  const isRealDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealDate) return "Enter a valid date";

  const today = new Date();
  if (date > today) return "Date of birth cannot be in the future";

  let age = today.getFullYear() - year;
  const hadBirthday =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);
  if (!hadBirthday) age -= 1;

  if (age < MIN_AGE) return `Age must be at least ${MIN_AGE} years`;
  if (age > MAX_AGE) return "Enter a valid date of birth";

  return null;
}

// Ordered so the most useful message shows first while the user is typing
function checkMobile(value: string) {
  if (!value) return null;

  if (!/^\d+$/.test(value) || value.length > 10) {
    return "Enter a 10 digit mobile number";
  }

  if (!/^[6-9]/.test(value)) {
    return "Mobile number must start with 6, 7, 8 or 9";
  }

  if (hasRepeat(value, 6)) {
    return "Mobile number cannot repeat the same digit";
  }

  if (value.length < 10) return "Enter a 10 digit mobile number";

  if (isSequential(value)) return "Enter a valid mobile number";

  return null;
}

// Class can be pre-primary (Pre KG, LKG, UKG), a school class (1 to 12),
// college, or any other course name.
function checkClass(value: string) {
  if (!value) return null;

  // School class written as a number: "5", "5th", "Class 5", "Std 10"
  const numbered =
    /^(?:class|std|standard|grade)?\s*(\d{1,2})\s*(?:st|nd|rd|th)?$/i.exec(
      value,
    );

  if (numbered) {
    const classNumber = Number(numbered[1]);

    return classNumber >= 1 && classNumber <= 12
      ? null
      : "Class must be between 1 and 12 (or enter LKG, UKG, College)";
  }

  // Everything else: Pre KG, LKG, UKG, Nursery, College, B.Sc, 2nd year ...
  if (
    !CLASS_PATTERN.test(value) ||
    letterSet(value).size < 2 ||
    hasRepeat(value.toLowerCase(), 4)
  ) {
    return CLASS_HINT;
  }

  if (value.length > 30) return "Class is too long";

  return null;
}

function checkSchool(value: string) {
  if (!value) return null;

  if (!SCHOOL_PATTERN.test(value)) return "Enter a valid school name";

  if (letterSet(value).size < 2 || hasRepeat(value.toLowerCase(), 4)) {
    return "Enter a valid school name";
  }

  if (value.length < 3) return "School name must be at least 3 characters";
  if (value.length > 100) return "School name is too long";

  return null;
}

// required + the field specific check
const requiredText = (
  requiredMessage: string,
  check: (value: string) => string | null,
) =>
  yup
    .string()
    .trim()
    .required(requiredMessage)
    .test("valid", (value, context) => {
      const message = check(value ?? "");
      return message ? context.createError({ message }) : true;
    });

const profileSchema = yup.object({
  name: requiredText("Name is required", (value) =>
    checkLetters(value, "Name", 50),
  ),
  dob: requiredText("Date of birth is required", checkDob),
  parentName: requiredText("Parent name is required", (value) =>
    checkLetters(value, "Parent name", 50),
  ),
  mobile: requiredText("Mobile number is required", checkMobile),
  className: requiredText("Class is required", checkClass),
  schoolName: requiredText("School name is required", checkSchool),
  city: requiredText("City is required", (value) =>
    checkLetters(value, "City", 50),
  ),
  country: requiredText("Country is required", (value) =>
    checkLetters(value, "Country", 56),
  ),
});

// Validates ONE field (used while the user is typing)
function validateField(field: FieldName, values: FormValues) {
  try {
    profileSchema.validateSyncAt(field, values);
    return undefined;
  } catch (error) {
    if (error instanceof yup.ValidationError) return error.message;
    throw error;
  }
}

// Validates ALL fields (used when the user taps Save Changes)
function validateAll(values: FormValues) {
  const errors: Partial<Record<FieldName, string>> = {};

  try {
    profileSchema.validateSync(values, { abortEarly: false });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      error.inner.forEach((item) => {
        const field = item.path as FieldName | undefined;
        // keep only the first message for each field
        if (field && !errors[field]) errors[field] = item.message;
      });
    } else {
      throw error;
    }
  }

  return errors;
}

// ---------- helpers ----------

// trims the text and turns repeated spaces into a single space
const clean = (value: string) => value.trim().replace(/\s+/g, " ");

function trimValues(values: FormValues): FormValues {
  return {
    name: clean(values.name),
    dob: clean(values.dob),
    parentName: clean(values.parentName),
    mobile: clean(values.mobile),
    className: clean(values.className),
    schoolName: clean(values.schoolName),
    city: clean(values.city),
    country: clean(values.country),
  };
}

// Same logic as the Activity page: use the StudentRegister document id if the
// email matches, otherwise fall back to the Firebase uid.
async function getStudentId(uid: string, email: string | null) {
  if (!email) return uid;

  try {
    const snapshot = await getDocs(
      query(collection(db, "StudentRegister"), where("email", "==", email)),
    );

    if (snapshot.docs.length > 0) {
      return snapshot.docs[0].id;
    }
  } catch (error) {
    console.error("Error getting student:", error);
  }

  return uid;
}

// Deletes the student's saved data (scores for every level + profile).
// Add any other places your app stores student data here.
async function deleteStudentData(studentId: string) {
  const levelSnapshot = await getDocs(
    collection(db, "QuestionBank", "Maths", "QuestionCategory"),
  );

  await Promise.all(
    levelSnapshot.docs.map((level) =>
      deleteDoc(
        doc(
          db,
          "StudentScoreSheet",
          studentId,
          "Maths",
          "QuestionCategory",
          level.id,
          "scoreData",
        ),
      ),
    ),
  );

  await deleteDoc(doc(db, "StudentRegister", studentId));
}

const fieldSx = (editable: boolean): SxProps<Theme> => ({
  "& .MuiOutlinedInput-root": {
    height: 54,
    borderRadius: "27px",
    bgcolor: editable ? "#ffffff" : "#f5f5f5",
    "& .MuiOutlinedInput-notchedOutline": {
      border: editable ? "1px solid #b8b8b8" : "none",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      border: editable ? "1px solid #6b7280" : "none",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      border: editable ? "2px solid #1a1a1a" : "none",
    },
  },
  "& .MuiInputBase-input": {
    fontWeight: 700,
    color: editable ? "#1a1a1a" : "#9ca3af",
    "&::placeholder": { color: "#8b8b8b", opacity: 1, fontWeight: 500 },
  },
});

type ProfileFieldProps = {
  placeholder: string;
  icon: ReactNode;
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
  error?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
};

function ProfileField({
  placeholder,
  icon,
  value,
  editable,
  onChange,
  error,
  inputMode,
  maxLength,
}: ProfileFieldProps) {
  return (
    <TextField
      fullWidth
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
      error={Boolean(error)}
      helperText={error}
      sx={fieldSx(editable)}
      slotProps={{
        input: {
          readOnly: !editable,
          startAdornment: (
            <InputAdornment
              position="start"
              sx={{ ml: 0.5, color: editable ? "#1a1a1a" : "#6b7280" }}
            >
              {icon}
            </InputAdornment>
          ),
        },
        htmlInput: { "aria-label": placeholder, inputMode, maxLength },
      }}
    />
  );
}

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

// ---------- page ----------

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [studentId, setStudentId] = useState("");
  const [docExists, setDocExists] = useState(false);
  const [loading, setLoading] = useState(true);

  const [values, setValues] = useState<FormValues>(EMPTY_FORM); // saved data
  const [draft, setDraft] = useState<FormValues>(EMPTY_FORM); // edit copy
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});

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
        const id = await getStudentId(currentUser.uid, currentUser.email);
        const snap = await getDoc(doc(db, "StudentRegister", id));
        const data = snap.exists() ? snap.data() : {};

        const loaded: FormValues = { ...EMPTY_FORM };
        (Object.keys(FIELD_KEYS) as FieldName[]).forEach((field) => {
          const stored = data[FIELD_KEYS[field]];
          if (stored !== undefined && stored !== null && stored !== "") {
            loaded[field] = String(stored);
          }
        });
        if (!loaded.name) loaded.name = currentUser.displayName ?? "";

        if (!cancelled) {
          setStudentId(id);
          setDocExists(snap.exists());
          setValues(loaded);
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
    let value: string;

    if (field === "mobile") {
      // digits only
      value = rawValue.replace(/\D/g, "").slice(0, 10);
    } else if (field === "dob") {
      // digits and slashes only
      value = rawValue.replace(/[^\d/]/g, "").slice(0, 10);
    } else {
      // no leading space, no double spaces
      value = rawValue.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
    }

    const nextDraft = { ...draft, [field]: value };

    setDraft(nextDraft);
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, nextDraft),
    }));
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
      const payload: Record<string, string> = {};
      (Object.keys(FIELD_KEYS) as FieldName[]).forEach((field) => {
        payload[FIELD_KEYS[field]] = cleaned[field];
      });

      // Only for a brand new document, so the email lookup works next time
      if (!docExists) payload.email = user.email ?? "";

      await setDoc(doc(db, "StudentRegister", studentId), payload, {
        merge: true,
      });

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
      // 1. Firebase only allows deleting an account after a recent login,
      //    so ask the user to confirm with Google first.
      await reauthenticateWithPopup(user, new GoogleAuthProvider());

      // 2. Delete the student's saved data
      await deleteStudentData(studentId);

      // 3. Delete the login itself (this also signs the user out)
      await deleteUser(user);

      router.replace("/practice");
    } catch (error) {
      console.error("Error deleting account:", error);

      const code = (error as { code?: string }).code;

      if (
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        setDeleteError(
          "Google confirmation was cancelled. Nothing was deleted.",
        );
      } else if (code === "auth/user-mismatch") {
        setDeleteError("Please confirm with the same Google account.");
      } else if (code === "permission-denied") {
        setDeleteError(
          "Not allowed to delete this data. Please contact support.",
        );
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
      <>
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
      </>
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
      sx={{ minHeight: "100vh", bgcolor: "#f8f6f6", pb: 6 }}
    >
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
