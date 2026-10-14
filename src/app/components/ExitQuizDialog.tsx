"use client";

// src/app/components/ExitQuizDialog.tsx

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

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
      slotProps={{ paper: { sx: { borderRadius: 5, p: 1, width: "100%", maxWidth: 360 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, textAlign: "center" }}>Exit Test?</DialogTitle>

      <DialogContent>
        <DialogContentText sx={{ textAlign: "center" }}>
          Your answers from this attempt will not be saved. Next time the test starts from the
          beginning.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", pb: 2, gap: 1 }}>
        <Button
          onClick={onStay}
          disabled={leaving}
          sx={{ color: "text.secondary", fontWeight: 700, textTransform: "none" }}
        >
          Stay
        </Button>

        <Button
          variant="contained"
          onClick={onExit}
          disabled={leaving}
          sx={{
            bgcolor: "#000",
            color: "#fff",
            borderRadius: 4,
            py: 1,
            px: 3,
            fontWeight: 700,
            textTransform: "none",
            "&:hover": { bgcolor: "#222" },
          }}
        >
          {leaving ? "Leaving..." : "Exit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}