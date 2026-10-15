"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  List,
  ListItemButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";
import PersonIcon from "@mui/icons-material/Person";
import LanguageIcon from "@mui/icons-material/Language";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import LogoutIcon from "@mui/icons-material/Logout";
import { auth } from "@/lib/firebase";

/* dark theme colours (same values as globals.css) */
const BG = "#000";
const CARD = "#141414";
const CARD_SOFT = "#1f1f1f";
const BORDER = "rgba(255,255,255,0.15)";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";

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
  {
    id: "activity",
    label: "Activity",
    icon: <LocalActivityIcon />,
    clickable: true,
  },
  { id: "profile", label: "Profile", icon: <PersonIcon />, clickable: true },
  {
    id: "language",
    label: "Language (En)",
    icon: <LanguageIcon />,
    clickable: false,
  },
];

export default function PracticeDrawer({ open, onClose }: PracticeDrawerProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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

  const handleLogoutClick = () => {
    setLogoutError("");
    setLogoutDialogOpen(true);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
    setLogoutError("");
  };

  const handleLogoutConfirm = async () => {
    setLogoutError("");

    try {
      setLoggingOut(true);
      await signOut(auth);
      setLogoutDialogOpen(false);
      onClose();
      router.push("/practice");
    } catch (error) {
      console.error("Error signing out:", error);
      setLogoutError("Failed to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogin = () => {
    onClose();
    router.push("/practice");
  };

  return (
    <>
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
              bgcolor: CARD,
              backgroundImage: "none",
              color: TEXT,
              borderRight: `1px solid ${BORDER}`,
            },
          },
          backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.75)" } },
        }}
      >
        {/* Profile header */}
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, p: 3, pt: 5 }}
        >
          <Box
            sx={{
              width: 50,
              height: 50,
              flexShrink: 0,
              borderRadius: "50%",
              border: `3px solid ${TEXT}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 24, fontWeight: 800, color: TEXT }}>
              {initial}
            </Typography>
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              noWrap
              sx={{ fontSize: 18, fontWeight: 800, color: TEXT }}
            >
              {displayName}
            </Typography>
            <Typography noWrap sx={{ fontSize: 14, color: TEXT_SOFT }}>
              {email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderColor: BORDER }} />

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
                color: TEXT,
                "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                // Keep the row looking normal when it is not clickable
                "&.Mui-disabled": { opacity: 1 },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 3,
                  bgcolor: CARD_SOFT,
                  border: `1px solid ${BORDER}`,
                  color: TEXT,
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
                  color: TEXT,
                }}
              >
                {item.label}
              </Typography>

              <ChevronRightIcon sx={{ color: TEXT_SOFT }} />
            </ListItemButton>
          ))}
        </List>

        {/* Logout / Login pinned to bottom */}
        <Box sx={{ mt: "auto", p: 2.5 }}>
          {user ? (
            <Button
              onClick={handleLogoutClick}
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
                boxShadow: "none",
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

      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
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
          Logout Confirmation
        </DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ color: TEXT_SOFT }}>
            Are you sure you want to logout?
          </DialogContentText>

          {logoutError && (
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
              {logoutError}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleLogoutCancel}
            disabled={loggingOut}
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
            onClick={handleLogoutConfirm}
            disabled={loggingOut}
            variant="contained"
            startIcon={
              loggingOut ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <LogoutIcon />
              )
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
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}