"use client";

// src/app/components/ExitQuizDialog.tsx

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

/* dark theme colours (same values as globals.css) */
const CARD = "#141414";
const BORDER = "rgba(255,255,255,0.15)";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";

type Props = {
  open: boolean;
  leaving: boolean;
  onStay: () => void;
  onExit: () => void;
};

export default function ExitQuizDialog({ open, leaving, onStay, onExit }: Props) {
  return (
    <Dialog
      open={open}
      onClose={leaving ? undefined : onStay}
      slotProps={{
        paper: {
          sx: {
            bgcolor: CARD,
            backgroundImage: "none",
            color: TEXT,
            border: `1px solid ${BORDER}`,
            borderRadius: 5,
            p: 1,
            width: "100%",
            maxWidth: 360,
          },
        },
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.75)" } },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, textAlign: "center", color: TEXT }}>
        Exit Test?
      </DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ textAlign: "center", color: TEXT_SOFT }}>
          Your answers from this attempt will not be saved. Next time the test starts from the
          beginning.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 1 }}>
        <Button
          onClick={onStay}
          disabled={leaving}
          sx={{
            color: TEXT_SOFT,
            fontWeight: 700,
            textTransform: "none",
            "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" },
          }}
        >
          Stay
        </Button>

        {/* white button with black text, a black button would disappear on the dark popup */}
        <Button
          variant="contained"
          onClick={onExit}
          disabled={leaving}
          sx={{
            bgcolor: "#fff",
            color: "#000",
            borderRadius: 4,
            py: 1,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { bgcolor: "#e5e5e5" },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,255,255,0.25)",
              color: "rgba(255,255,255,0.5)",
            },
          }}
        >
          {leaving ? "Leaving..." : "Exit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}