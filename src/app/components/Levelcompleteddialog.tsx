"use client";

// src/app/components/LevelCompletedDialog.tsx
// Popup shown right after a test is finished.

import Alert, { type AlertColor } from "@mui/material/Alert";
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

/* dark theme colours (same values as globals.css) */
const CARD = "#141414";
const CARD_SOFT = "#1f1f1f";
const BORDER = "rgba(255,255,255,0.15)";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";
const DANGER = "#ff6b6b";
const SUCCESS = "#4ade80";

// dark version of the MUI Alert for each severity
const alertColors: Record<AlertColor, { bg: string; color: string }> = {
  info: { bg: "rgba(56,189,248,0.12)", color: "#7dd3fc" },
  warning: { bg: "rgba(251,146,60,0.12)", color: "#fdba74" },
  error: { bg: "rgba(255,107,107,0.12)", color: "#ff8a8a" },
  success: { bg: "rgba(74,222,128,0.12)", color: "#86efac" },
};

function darkAlertSx(severity: AlertColor, extra: object = {}) {
  const c = alertColors[severity] ?? alertColors.info;

  return {
    bgcolor: c.bg,
    color: c.color,
    border: `1px solid ${c.color}33`,
    "& .MuiAlert-icon": { color: c.color },
    ...extra,
  };
}

// main button: white with black text (a black button would disappear on black)
const mainButtonSx = {
  py: 1.5,
  borderRadius: 4,
  bgcolor: "#fff",
  color: "#000",
  textTransform: "none",
  fontWeight: 700,
  "&:hover": { bgcolor: "#e5e5e5" },
  "&.Mui-disabled": {
    bgcolor: "rgba(255,255,255,0.25)",
    color: "rgba(255,255,255,0.5)",
  },
} as const;

// second button: white outline
const outlinedButtonSx = {
  py: 1.5,
  borderRadius: 4,
  color: "#fff",
  borderColor: "rgba(255,255,255,0.6)",
  textTransform: "none",
  fontWeight: 700,
  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,0.3)",
    borderColor: "rgba(255,255,255,0.2)",
  },
} as const;

const badgeChipSx = {
  fontWeight: 700,
  color: SUCCESS,
  borderColor: SUCCESS,
} as const;

const timeChipSx = {
  fontWeight: 700,
  color: TEXT,
  borderColor: BORDER,
  "& .MuiChip-icon": { color: TEXT },
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

  // bright colours so the result title is readable on black
  const resultColor = info.status === "repeat" ? DANGER : SUCCESS;

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            bgcolor: CARD,
            backgroundImage: "none",
            color: TEXT,
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            p: 0.5,
          },
        },
        backdrop: { sx: { backgroundColor: "rgba(0,0,0,0.75)" } },
      }}
    >
      <DialogContent sx={{ textAlign: "center", pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: TEXT }}>
          {guest ? "Quiz completed" : "Level completed"}
        </Typography>

        {guest ? (
          <Typography sx={{ color: TEXT_SOFT }}>
            Log in to save your progress and view activity.
          </Typography>
        ) : (
          <>
            <Avatar
              sx={{ width: 72, height: 72, bgcolor: CARD_SOFT, fontSize: 38, mx: "auto", mb: 1.5 }}
            >
              {info.icon}
            </Avatar>

            <Paper
              elevation={0}
              sx={{
                py: 1.5,
                borderRadius: 3,
                bgcolor: CARD_SOFT,
                backgroundImage: "none",
                border: `1px solid ${BORDER}`,
                mb: 1.5,
              }}
            >
              <Typography variant="body2" sx={{ color: TEXT_SOFT }}>
                Your score
              </Typography>

              <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT }}>
                {totalScore} / {totalQuestions}
              </Typography>
            </Paper>

            <Typography variant="h6" sx={{ fontWeight: 700, color: resultColor, mb: 1.5 }}>
              {info.title}
            </Typography>

            {!result && (
              <Box sx={{ mb: 1 }}>
                <LinearProgress
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.15)",
                    "& .MuiLinearProgress-bar": { bgcolor: "#fff" },
                  }}
                />
                <Typography variant="caption" sx={{ color: TEXT_SOFT }}>
                  Saving your score...
                </Typography>
              </Box>
            )}

            {result && (
              <Stack direction="row" spacing={1} sx={{ mb: 1.5, justifyContent: "center" }}>
                {badge && (
                  <Chip
                    label={`${getBadgeIcon(badge)} ${badge}`}
                    variant="outlined"
                    sx={badgeChipSx}
                  />
                )}

                <Chip
                  icon={<TimerOutlinedIcon />}
                  label={formatTime(result.totalSeconds)}
                  variant="outlined"
                  sx={timeChipSx}
                />
              </Stack>
            )}

            {result?.error && (
              <Alert severity="warning" sx={darkAlertSx("warning", { mb: 1, textAlign: "left" })}>
                {result.error}
              </Alert>
            )}

            {result && (
              <Alert
                severity={info.severity}
                sx={darkAlertSx(info.severity, { mb: 1.5, textAlign: "left" })}
              >
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
                  sx={{ color: "rgba(255,255,255,0.2)", position: "absolute" }}
                />
                <CircularProgress
                  variant="determinate"
                  value={(countdown / countdownStart) * 100}
                  size={44}
                  thickness={4}
                  sx={{ color: "#fff" }}
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
                  <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT }}>
                    {countdown}
                  </Typography>
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
            <Button fullWidth variant="contained" onClick={onLogin} sx={mainButtonSx}>
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
              sx={mainButtonSx}
            >
              {nextLevel ? "Move to Next Level" : "Back to Home"}
            </Button>

            {nextLevel && (
              <Button
                fullWidth
                variant="outlined"
                disabled={!result}
                onClick={onHome}
                sx={outlinedButtonSx}
              >
                Back to Home
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}