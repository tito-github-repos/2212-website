import * as yup from "yup";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type FormValues = {
  name: string;
  dob: string;
  parentName: string;
  mobile: string;
  className: string;
  schoolName: string;
  city: string;
  country: string;
};

export type FieldName = keyof FormValues;
export type FormErrors = Partial<Record<FieldName, string>>;

// "profile"      = My Profile page: every field is required
// "registration" = first-time registration: only REGISTRATION_REQUIRED fields
//                  are required, the rest can be left empty
export type ValidationMode = "profile" | "registration";

// Fields that must be filled to complete the first-time registration.
// Everything else can be left empty and filled in later from My Profile.
// (Anything that IS typed is still checked, e.g. a mobile number must be valid.)
const REGISTRATION_REQUIRED: FieldName[] = ["name"];

// Maps each form field to its field name in the StudentRegister document.
// If your mobile app uses different names, change ONLY the right-hand side.
export const FIELD_KEYS: Record<FieldName, string> = {
  name: "name",
  dob: "dob",
  parentName: "parentName",
  mobile: "mobile",
  className: "class",
  schoolName: "schoolName",
  city: "city",
  country: "country",
};

export const EMPTY_FORM: FormValues = {
  name: "",
  dob: "",
  parentName: "",
  mobile: "",
  className: "",
  schoolName: "",
  city: "",
  country: "India",
};

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

// A text field: optionally required, plus the field specific check
const text = (
  required: boolean,
  requiredMessage: string,
  check: (value: string) => string | null,
) =>
  yup
    .string()
    .trim()
    .test("required", requiredMessage, (value) => !required || Boolean(value))
    .test("valid", (value, context) => {
      const message = check(value ?? "");
      return message ? context.createError({ message }) : true;
    });

// Builds the schema. `isRequired` says which fields must be filled.
const buildSchema = (isRequired: (field: FieldName) => boolean) =>
  yup.object({
    name: text(isRequired("name"), "Name is required", (value) =>
      checkLetters(value, "Name", 50),
    ),
    dob: text(isRequired("dob"), "Date of birth is required", checkDob),
    parentName: text(
      isRequired("parentName"),
      "Parent name is required",
      (value) => checkLetters(value, "Parent name", 50),
    ),
    mobile: text(
      isRequired("mobile"),
      "Mobile number is required",
      checkMobile,
    ),
    className: text(isRequired("className"), "Class is required", checkClass),
    schoolName: text(
      isRequired("schoolName"),
      "School name is required",
      checkSchool,
    ),
    city: text(isRequired("city"), "City is required", (value) =>
      checkLetters(value, "City", 50),
    ),
    country: text(isRequired("country"), "Country is required", (value) =>
      checkLetters(value, "Country", 56),
    ),
  });

// My Profile: every field is required
const profileSchema = buildSchema(() => true);

// First-time registration: only REGISTRATION_REQUIRED fields are required
const registrationSchema = buildSchema((field) =>
  REGISTRATION_REQUIRED.includes(field),
);

const getSchema = (mode: ValidationMode) =>
  mode === "registration" ? registrationSchema : profileSchema;

// Validates ONE field (used while the user is typing)
export function validateField(
  field: FieldName,
  values: FormValues,
  mode: ValidationMode = "profile",
) {
  try {
    getSchema(mode).validateSyncAt(field, values);
    return undefined;
  } catch (error) {
    if (error instanceof yup.ValidationError) return error.message;
    throw error;
  }
}

// Validates ALL fields (used when the user taps Save / Complete Registration)
export function validateAll(
  values: FormValues,
  mode: ValidationMode = "profile",
) {
  const errors: FormErrors = {};

  try {
    getSchema(mode).validateSync(values, { abortEarly: false });
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

// ---------- input cleaning ----------

// Cleans what the user types in a field (runs on every keystroke)
export function cleanInput(field: FieldName, rawValue: string) {
  if (field === "mobile") {
    // digits only
    return rawValue.replace(/\D/g, "").slice(0, 10);
  }

  if (field === "dob") {
    // digits and slashes only
    return rawValue.replace(/[^\d/]/g, "").slice(0, 10);
  }

  // no leading space, no double spaces
  return rawValue.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
}

// trims the text and turns repeated spaces into a single space
const clean = (value: string) => value.trim().replace(/\s+/g, " ");

export function trimValues(values: FormValues): FormValues {
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

// ---------- Firestore ----------

// Finds the student's StudentRegister document, the same way the app does:
// 1. The app saves each student under their Firebase uid, so check that first.
// 2. Older accounts were saved under a random id, so fall back to the email.
// 3. Otherwise this is a first-time user: a new document will use the uid.
async function findStudentDoc(
  user: User,
): Promise<{ studentId: string; snap: DocumentSnapshot }> {
  const byUid = await getDoc(doc(db, "StudentRegister", user.uid));

  if (byUid.exists()) {
    return { studentId: user.uid, snap: byUid };
  }

  if (user.email) {
    try {
      const found = await getDocs(
        query(
          collection(db, "StudentRegister"),
          where("email", "==", user.email),
        ),
      );

      if (found.docs.length > 0) {
        return { studentId: found.docs[0].id, snap: found.docs[0] };
      }
    } catch (error) {
      console.error("Error getting student by email:", error);
    }
  }

  return { studentId: user.uid, snap: byUid };
}

export async function getStudentId(user: User) {
  const { studentId } = await findStudentDoc(user);
  return studentId;
}

// Loads the student's saved profile.
// `exists`      is false for a first-time user (no profile saved yet).
// `deactivated` is true when the account was deleted (deactivated).
export async function loadStudentProfile(user: User) {
  const { studentId, snap } = await findStudentDoc(user);
  const data: DocumentData = snap.exists() ? snap.data() : {};

  const values: FormValues = { ...EMPTY_FORM };
  (Object.keys(FIELD_KEYS) as FieldName[]).forEach((field) => {
    const stored = data[FIELD_KEYS[field]];
    if (stored !== undefined && stored !== null && stored !== "") {
      values[field] = String(stored);
    }
  });

  // First time: start with the name from the Google account
  if (!values.name) values.name = user.displayName ?? "";

  // Same rule as the mobile app: only an explicit false blocks the account.
  // A missing isActive field means the account is active.
  const deactivated = snap.exists() && data.isActive === false;

  return { studentId, exists: snap.exists(), deactivated, values };
}

export async function saveStudentProfile(
  user: User,
  studentId: string,
  exists: boolean,
  values: FormValues,
) {
  const payload: Record<string, string | boolean> = {};
  (Object.keys(FIELD_KEYS) as FieldName[]).forEach((field) => {
    payload[FIELD_KEYS[field]] = values[field];
  });

  // Only for a brand new document: the email lookup works next time,
  // and new registrations start as active (same as the mobile app)
  if (!exists) {
    payload.email = user.email ?? "";
    payload.isActive = true;
  }

  await setDoc(doc(db, "StudentRegister", studentId), payload, {
    merge: true,
  });
}

// "Delete account": nothing is erased. Exactly like the mobile app, the
// account is only marked isActive: false (and updatedAt is refreshed),
// so support can reactivate it.
export async function deactivateStudentAccount(
  user: User,
  studentId: string,
  exists: boolean,
) {
  const payload: Record<string, unknown> = {
    isActive: false,
    updatedAt: serverTimestamp(),
  };

  // Only for a brand new document, so the email lookup works next time
  if (!exists) payload.email = user.email ?? "";

  await setDoc(doc(db, "StudentRegister", studentId), payload, {
    merge: true,
  });
}