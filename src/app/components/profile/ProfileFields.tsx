"use client";

import type { ReactNode } from "react";
import { InputAdornment, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import PersonIcon from "@mui/icons-material/Person";
import CakeIcon from "@mui/icons-material/Cake";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PhoneIcon from "@mui/icons-material/Phone";
import SchoolIcon from "@mui/icons-material/School";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import PublicIcon from "@mui/icons-material/Public";

import type { FieldName } from "@/lib/studentProfile";

export type FieldConfig = {
  name: FieldName;
  placeholder: string;
  icon: ReactNode;
  inputMode?: "numeric" | "text";
  maxLength?: number;
};

export const PERSONAL_FIELDS: FieldConfig[] = [
  { name: "name", placeholder: "Name", icon: <PersonIcon /> },
  {
    name: "dob",
    placeholder: "Date of Birth (DD/MM/YYYY)",
    icon: <CakeIcon />,
    inputMode: "numeric",
    maxLength: 10,
  },
  { name: "parentName", placeholder: "Parent Name", icon: <FamilyRestroomIcon /> },
  {
    name: "mobile",
    placeholder: "Mobile Number",
    icon: <PhoneIcon />,
    inputMode: "numeric",
    maxLength: 10,
  },
];

export const ACADEMIC_FIELDS: FieldConfig[] = [
  { name: "className", placeholder: "Class", icon: <SchoolIcon /> },
  { name: "schoolName", placeholder: "School Name", icon: <AccountBalanceIcon /> },
];

export const LOCATION_FIELDS: FieldConfig[] = [
  { name: "city", placeholder: "City", icon: <LocationCityIcon /> },
  { name: "country", placeholder: "Country", icon: <PublicIcon /> },
];

// "profile"  = bordered fields used on the My Profile page
// "register" = white fields with a soft shadow used on the registration page
export type FieldAppearance = "profile" | "register";

const fieldSx = (
  editable: boolean,
  appearance: FieldAppearance,
): SxProps<Theme> => {
  if (appearance === "register") {
    return {
      "& .MuiOutlinedInput-root": {
        height: 54,
        borderRadius: "27px",
        bgcolor: "#ffffff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
        "& .MuiOutlinedInput-notchedOutline": { border: "none" },
        "&.Mui-focused": { boxShadow: "0 0 0 2px #1a1a1a" },
        "&.Mui-error": { boxShadow: "0 0 0 1px #d32f2f" },
      },
      "& .MuiInputBase-input": {
        fontWeight: 500,
        color: "#1a1a1a",
        "&::placeholder": { color: "#8b8b8b", opacity: 1, fontWeight: 500 },
      },
    };
  }

  return {
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
  };
};

type ProfileFieldProps = {
  placeholder: string;
  icon: ReactNode;
  value: string;
  editable: boolean;
  onChange?: (value: string) => void;
  error?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  appearance?: FieldAppearance;
};

export function ProfileField({
  placeholder,
  icon,
  value,
  editable,
  onChange,
  error,
  inputMode,
  maxLength,
  appearance = "profile",
}: ProfileFieldProps) {
  const iconColor =
    appearance === "register" || editable ? "#1a1a1a" : "#6b7280";

  return (
    <TextField
      fullWidth
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange?.(event.target.value)}
      error={Boolean(error)}
      helperText={error}
      sx={fieldSx(editable, appearance)}
      slotProps={{
        input: {
          readOnly: !editable,
          startAdornment: (
            <InputAdornment position="start" sx={{ ml: 0.5, color: iconColor }}>
              {icon}
            </InputAdornment>
          ),
        },
        htmlInput: { "aria-label": placeholder, inputMode, maxLength },
      }}
    />
  );
}