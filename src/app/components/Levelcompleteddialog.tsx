"use client";

// src/app/components/LevelCompletedDialog.tsx
// Popup shown right after a test is finished.

import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HomeIcon from "@mui/icons-material/Home";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { formatTime, getBadgeIcon, getResultInfo } from "@/lib/quizRules";
import type { SubmitResult } from "@/lib/useQuestionController";

type NextLevel = NonNullable<SubmitResult["nextLevel"]>;

type Props = {
  open: boolean;
  guest: boolean;
  totalScore: number;
  totalQuestions: number;
  /** null while the score is still being saved */
  result: SubmitResult | null;
  /** optional round countdown (for example before moving to the next level) */
  countdown?: number;
  countdownStart?: number;
  onLogin: () => void;
  onHome: () => void;
  onNextLevel: (level: NextLevel) => void;
};

const blackButtonSx = {
  py: 1.5,
  borderRadius: 4,
  bgcolor: "#000",
  color: "#fff",
  textTransform: "none",
  fontWeight: 700,
  "&:hover": { bgcolor: "#222" },
} as const;

const outlinedButtonSx = {
  py: 1.5,
  borderRadius: 4,
  color: "#000",
  borderColor: "#000",
  textTransform: "none",
  fontWeight: 700,
  "&:hover": { borderColor: "#000", bgcolor: "grey.100" },
} as const;

export default function LevelCompletedDialog({
  open,
  guest,
  totalScore,
  totalQuestions,
  result,
  countdown,
  countdownStart = 5,
  onLogin,
  onHome,
  onNextLevel,
}: Props) {
  const info = getResultInfo(totalScore, totalQuestions);
  const badge = result?.badge ?? "";
  const nextLevel = result?.nextLevel ?? null;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { borderRadius: 4, p: 0.5 } } }}
    >
      <DialogContent sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          {guest ? "Quiz completed" : "Level completed"}
        </Typography>

        {guest ? (
          <Typography color="text.secondary">
            Log in to save your progress and view activity.
          </Typography>
        ) : (
          <>
            <Avatar
              sx={{ width: 72, height: 72, bgcolor: "grey.100", fontSize: 38, mx: "auto", mb: 1.5 }}
            >
              {info.icon}
            </Avatar>

            <Paper
              variant="outlined"
              sx={{ py: 1.5, borderRadius: 3, bgcolor: "grey.50", borderColor: "grey.200", mb: 1.5 }}
            >
              <Typography variant="body2" color="text.secondary">
                Your score
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {totalScore} / {totalQuestions}
              </Typography>
            </Paper>

            <Typography variant="h6" sx={{ fontWeight: 700, color: info.color, mb: 1.5 }}>
              {info.title}
            </Typography>

            {!result && (
              <Box sx={{ mb: 1 }}>
                <LinearProgress sx={{ height: 5, borderRadius: 3 }} />
                <Typography variant="caption" color="text.secondary">
                  Saving your score...
                </Typography>
              </Box>
            )}

            {result && (
              <Stack direction="row" spacing={1} sx={{ mb: 1.5, justifyContent: "center" }}>
                {badge && (
                  <Chip
                    label={`${getBadgeIcon(badge)} ${badge}`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                )}

                <Chip
                  icon={<TimerOutlinedIcon />}
                  label={formatTime(result.totalSeconds)}
                  variant="outlined"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            )}

            {result?.error && (
              <Alert severity="warning" sx={{ mb: 1, textAlign: "left" }}>
                {result.error}
              </Alert>
            )}

            {result && (
              <Alert severity={info.severity} sx={{ mb: 1.5, textAlign: "left" }}>
                {info.message}
              </Alert>
            )}

            {countdown !== undefined && countdown > 0 && (
              <Box sx={{ position: "relative", display: "inline-flex" }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={44}
                  thickness={4}
                  sx={{ color: "grey.300", position: "absolute" }}
                />
                <CircularProgress
                  variant="determinate"
                  value={(countdown / countdownStart) * 100}
                  size={44}
                  thickness={4}
                  sx={{ color: "#222" }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography sx={{ fontWeight: 800, fontSize: 16 }}>{countdown}</Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2.5,
          flexDirection: "column",
          gap: 1,
          "& > :not(style) ~ :not(style)": { ml: 0 },
        }}
      >
        {guest ? (
          <>
            <Button fullWidth variant="contained" onClick={onLogin} sx={blackButtonSx}>
              Log in
            </Button>

            <Button fullWidth variant="outlined" onClick={onHome} sx={outlinedButtonSx}>
              Close
            </Button>
          </>
        ) : (
          <>
            <Button
              fullWidth
              variant="contained"
              disabled={!result}
              endIcon={nextLevel ? <ArrowForwardIcon /> : <HomeIcon />}
              onClick={() => (nextLevel ? onNextLevel(nextLevel) : onHome())}
              sx={blackButtonSx}
            >
              {nextLevel ? "Move to Next Level" : "Back to Home"}
            </Button>

            {nextLevel && (
              <Button fullWidth variant="outlined" disabled={!result} onClick={onHome} sx={outlinedButtonSx}>
                Back to Home
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}