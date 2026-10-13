"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  Typography,
} from "@mui/material";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import PersonIcon from "@mui/icons-material/Person";
import LanguageIcon from "@mui/icons-material/Language";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import { auth } from "@/lib/firebase";

type PracticeDrawerProps = {
  open: boolean;
  onClose: () => void;
};

type MenuItem = {
  id: "activity" | "profile" | "language";
  label: string;
  icon: React.ReactNode;
  clickable: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { id: "activity", label: "Activity", icon: <LocalActivityIcon />, clickable: true },
  { id: "profile", label: "Profile", icon: <PersonIcon />, clickable: true },
  { id: "language", label: "Language (En)", icon: <LanguageIcon />, clickable: false },
];

export default function PracticeDrawer({ open, onClose }: PracticeDrawerProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Keeps the drawer in sync with Firebase login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const displayName = user?.displayName || (user ? "Student" : "Guest");
  const email = user?.email || "Sign in to save your scores";
  const initial = (user?.displayName || user?.email || "G")
    .charAt(0)
    .toUpperCase();

  const handleItemClick = (id: MenuItem["id"]) => {
    onClose();

    if (id === "activity") {
      router.push("/activity");
    }

    if (id === "profile") {
      router.push("/profile");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
      router.push("/practice");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleLogin = () => {
    onClose();
    router.push("/practice");
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            maxWidth: "85vw",
            borderRadius: "0 28px 28px 0",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      {/* Profile header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 3, pt: 5 }}>
        <Box
          sx={{
            width: 50,
            height: 50,
            flexShrink: 0,
            borderRadius: "50%",
            border: "3px solid #1a1a1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a" }}>
            {initial}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}
          >
            {displayName}
          </Typography>
          <Typography noWrap sx={{ fontSize: 14, color: "#6b7280" }}>
            {email}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Menu items */}
      <List
        sx={{
          px: 1.5,
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        {MENU_ITEMS.map((item) => (
          <ListItemButton
            key={item.id}
            disabled={!item.clickable}
            onClick={() => handleItemClick(item.id)}
            sx={{
              borderRadius: 3,
              py: 1.2,
              gap: 2,
              // Keep the row looking normal when it is not clickable
              "&.Mui-disabled": { opacity: 1 },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 3,
                bgcolor: "#e5e7eb",
                color: "#1f2937",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.icon}
            </Box>

            <Typography
              sx={{
                flexGrow: 1,
                fontSize: 16,
                fontWeight: 800,
                color: "#1a1a1a",
              }}
            >
              {item.label}
            </Typography>

            <ChevronRightIcon sx={{ color: "#6b7280" }} />
          </ListItemButton>
        ))}
      </List>

      {/* Logout / Login pinned to bottom */}
      <Box sx={{ mt: "auto", p: 2.5 }}>
        {user ? (
          <Button
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              height: 56,
              borderRadius: 4,
              bgcolor: "#e84c3d",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 10px rgba(232,76,61,0.3)",
              "&:hover": { bgcolor: "#d63f31" },
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            onClick={handleLogin}
            fullWidth
            sx={{
              height: 56,
              borderRadius: 4,
              bgcolor: "#16a34a",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "#15803d" },
            }}
          >
            Login
          </Button>
        )}
      </Box>
    </Drawer>
  );
}