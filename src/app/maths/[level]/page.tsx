// //src\app\maths\[level]\page.tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import { keyframes } from "@emotion/react";
import Alert, { type AlertColor } from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import MicIcon from "@mui/icons-material/Mic";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { formatTime, getBadgeIcon, getResultInfo } from "../../../lib/quizRules";
import { areAnswersEquivalent } from "../../../lib/answerMatch";
import { type AnswerMode, type LevelInfo, type TestMode } from "../../../lib/questionService";
import { useVoiceAnswer } from "../../../lib/useVoiceAnswer";
import { useDeepgramVoiceAnswer, type VoiceTiming } from "../../../lib/useDeepgramVoiceAnswer";
import {
  useQuestionController,
  type SubmitResult,
} from "../../../lib/useQuestionController";
import ExitQuizDialog from "@/app/components/ExitQuizDialog";

const SUBJECT = "Maths";
const COUNTDOWN_START = 5; // seconds shown in the completed popup before going to the levels

/* dark theme colours (same values as globals.css) */
const BG = "#000";
const CARD = "#141414";
const CARD_SOFT = "#1f1f1f";
const BORDER = "rgba(255,255,255,0.15)";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";
const DANGER = "#ff6b6b";
const SUCCESS = "#4ade80";

// NEXT_PUBLIC_VOICE_ENGINE=deepgram in .env.local turns Deepgram on; remove it to use the old voice
const USE_DEEPGRAM = process.env.NEXT_PUBLIC_VOICE_ENGINE === "deepgram";

// timing panel is hidden for students; set NEXT_PUBLIC_VOICE_DEBUG=true in .env.local to show it
const SHOW_VOICE_DEBUG = process.env.NEXT_PUBLIC_VOICE_DEBUG === "true";

// keyboard mode: the typed answer is handed in by itself, like in voice mode
//   the typed answer is right  -> hand it in after a short pause (the student may still be typing)
//   the typed answer is not right -> hand it in after the student stops typing for a while
// Enter or the Next button still hands it in at once
const KEYBOARD_FAST_MS = 300;
const KEYBOARD_SLOW_MS = 1500;

// total seconds for the whole test in each mode (0 = no time limit, the student sets the pace)
const TEST_SECONDS: Record<TestMode, number> = {
  ownPace: 0,
  twoMinute: 120,
  oneMinute: 60,
};

const TEST_MODE_HELP: Record<TestMode, string> = {
  ownPace: "The next question comes when you answer. No time limit.",
  twoMinute:
    "All 60 questions must finish within 2 minutes. If you do not answer in time, the question is skipped. You cannot leave until the timer finishes.",
  oneMinute:
    "All 60 questions must finish within 1 minute. If you do not answer in time, the question is skipped. You cannot leave until the timer finishes.",
};

const GENERAL_LINES = [
  "There are ten tests here. Each test has 60 numerical.",
  "You need to solve each test by less than a minute.",
  "The goal is to solve within 30 seconds.",
  "Excellent: Solving it by less than 30 seconds.",
  "Very Good: Solving it by less than 60 seconds.",
  "Good: Solving it by less than 120 seconds.",
];

const SPECIFIC_LINES = [
  "Getting full score of 60 out of 60 is our target.",
  "If you are getting a score of 59/58 is ok.",
  "If you are getting 57 and less than that, you can repeat the test.",
];

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.55); }
  70% { box-shadow: 0 0 0 16px rgba(249, 115, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
`;

const pageSx = { minHeight: "100vh", bgcolor: BG, color: TEXT };

const numSx = { fontVariantNumeric: "tabular-nums", letterSpacing: -1 };

// dark card used for the score card, instructions card, question card, popup...
const cardSx = {
  bgcolor: CARD,
  backgroundImage: "none",
  color: TEXT,
  border: `1px solid ${BORDER}`,
};

// main button: white with black text (a black button would disappear on black)
const mainButtonSx = {
  py: 1.75,
  borderRadius: 4,
  bgcolor: "#fff",
  color: "#000",
  "&:hover": { bgcolor: "#e5e5e5" },
  "&.Mui-disabled": {
    bgcolor: "rgba(255,255,255,0.25)",
    color: "rgba(255,255,255,0.5)",
  },
};

// second button: white outline
const outlinedButtonSx = {
  py: 1.5,
  borderRadius: 4,
  color: "#fff",
  borderColor: "rgba(255,255,255,0.6)",
  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" },
};

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

// green outlined chip (badge)
const badgeChipSx = {
  fontWeight: 700,
  color: SUCCESS,
  borderColor: SUCCESS,
};

// white outlined chip (timer)
const timeChipSx = {
  fontWeight: 700,
  color: TEXT,
  borderColor: BORDER,
  "& .MuiChip-icon": { color: TEXT },
};

// the time now, for the Deepgram timing only. It lives outside the component because
// handleAnswer is handed to the voice hook, and the React checker would otherwise treat a
// direct performance.now() call there as "impure code during render".
function nowMs() {
  return performance.now();
}

function medianOf(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function nextLevelPath(level: LevelInfo) {
  return `/maths/${level.levelId}?title=${encodeURIComponent(level.categoryName)}`;
}

/* The outer page gives every level its own copy of the quiz.
   Without the key, "Move to Next Level" would keep the old level's state. */
export default function LevelPage() {
  const params = useParams();
  const level = params.level as string;

  return (
    <Suspense fallback={null}>
      <LevelQuiz key={level} level={level} />
    </Suspense>
  );
}

function LevelQuiz({ level }: { level: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const titleFromUrl = searchParams.get("title");

  const controller = useQuestionController(SUBJECT, level);

  const {
    questions,
    currentQuestionIndex,
    isLoading,
    error,
    totalScore,
    totalElapsedSeconds,
    previous,
    student,
  } = controller;

  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // true after "Retry Test" is pressed on the score page
  const [retrying, setRetrying] = useState(false);

  // how the student answers: speaking or typing (chosen on the instructions page)
  const [answerMode, setAnswerMode] = useState<AnswerMode>("voice");
  const [typedAnswer, setTypedAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const typedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typedRef = useRef(""); // the typed text right now (the timer needs the latest value)

  // exit popup (used when the 1 minute challenge is OFF)
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const exitDialogRef = useRef(false);

  // test mode: own pace, 2 minute or 1 minute (chosen on the instructions page)
  const [testMode, setTestMode] = useState<TestMode>("ownPace");
  const testSeconds = TEST_SECONDS[testMode];
  const deadlineRef = useRef(0); // when the timed test ends (performance.now() clock)
  const [quizSeconds, setQuizSeconds] = useState(0);
  const [challengeRunning, setChallengeRunning] = useState(false); // fixed when the test starts
  const [exitHintOpen, setExitHintOpen] = useState(false); // orange "cannot leave" message

  // countdown shown in the "Level completed" popup
  const [countdown, setCountdown] = useState(COUNTDOWN_START);

  const finishedRef = useRef(false);

    // one answer per question: blocks a second hand-in before React has moved to the next question
  const answeredForRef = useRef(-1);
  const indexRef = useRef(currentQuestionIndex);

  // keep the ref in step with the shown question (a ref must not be written during render)
  useEffect(() => {
    indexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);
  // Deepgram test: how long the screen takes to show the next question after an answer is handed in
  const answerAtRef = useRef<number | null>(null);
  const [switchMs, setSwitchMs] = useState<number[]>([]);


  const title = titleFromUrl || questions[0]?.category || "Addition";

  /* ------------------------------- voice ---------------------------------- */
  // USE_DEEPGRAM never changes while the app runs, so the same hook is used on every render
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const useVoice: typeof useDeepgramVoiceAnswer = USE_DEEPGRAM
    ? useDeepgramVoiceAnswer
    : (useVoiceAnswer as unknown as typeof useDeepgramVoiceAnswer);

  const voice = useVoice({
    onAnswer: (text) => handleAnswer(text),
    getCorrectAnswer: () => controller.getCorrectAnswer(),
    canListen: () => !finishedRef.current,
  });

  const { listening, heardText, micMessage, micReady, startListening, stopListening, clearHeard } = voice;

  // only the Deepgram hook measures timing
  const timings = voice.timings as VoiceTiming[] | undefined;
  const voiceStats = voice.stats;

  // keep the timings for reference even though the panel is hidden
  useEffect(() => {
    if (!USE_DEEPGRAM || !timings?.length) return;

    try {
      localStorage.setItem(
        `voiceTimings:${level}`,
        JSON.stringify({ savedAt: new Date().toISOString(), level, voiceStats, switchMs, timings })
      );
    } catch {
      /* storage full or blocked: ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timings, switchMs]);

  function handleAnswer(text: string) {
    if (finishedRef.current || exitDialogRef.current) return;
       // already answered this question, waiting for the next one to appear
    if (answeredForRef.current === indexRef.current) return;
    answeredForRef.current = indexRef.current;

    answerAtRef.current = nowMs();
    if (controller.isLastQuestion()) {
      void finishQuiz(text);
      return;
    }

    controller.nextQuestion(text);
  }

  /* ------------------------------- keyboard ------------------------------- */

  function clearTypedTimer() {
    if (typedTimerRef.current) {
      clearTimeout(typedTimerRef.current);
      typedTimerRef.current = null;
    }
  }

  // hands the typed answer in and clears the box for the next question
  function sendTyped(answer: string) {
    clearTypedTimer();

    if (finishedRef.current || exitDialogRef.current) return;

    setTypedAnswer("");
    typedRef.current = "";
    handleAnswer(answer);
  }

  // every key press: restart the wait, then hand the answer in when the wait is over
  function handleTyping(value: string) {
    setTypedAnswer(value);
    typedRef.current = value;
    clearTypedTimer();

    const answer = value.trim();
    if (!answer) return;

    const isRight = areAnswersEquivalent(answer, controller.getCorrectAnswer());

    typedTimerRef.current = setTimeout(
      () => sendTyped(answer),
      isRight ? KEYBOARD_FAST_MS : KEYBOARD_SLOW_MS
    );
  }

  // timed modes: this question's share of the time is over, move on.
  // Whatever is typed so far is handed in; an empty box means the question is skipped (saved blank).
  function timeUp() {
    clearTypedTimer();

    const text = typedRef.current.trim();
    typedRef.current = "";
    setTypedAnswer("");
    clearHeard();

    handleAnswer(text);
  }

  // Enter or the Next button: hand it in right now
  function submitTyped() {
    const value = typedAnswer.trim();
    if (!value) return;

    sendTyped(value);
  }

  /* -------------------------------- quiz ---------------------------------- */

  // every start is a fresh test from question 1
  // nothing is saved until the test is completed
  async function startQuiz() {
    if (starting || questions.length === 0) return;

    setStarting(true);

    try {
      controller.startAttempt();

      finishedRef.current = false;
      exitDialogRef.current = false;
      setExitDialogOpen(false);
      setExitHintOpen(false);
      setChallengeRunning(testSeconds > 0);
      deadlineRef.current = nowMs() + testSeconds * 1000;
      setResult(null);
      setCompleted(false);
      setCountdown(COUNTDOWN_START);
      setQuizSeconds(testSeconds);
      clearHeard();
      setTypedAnswer("");
      typedRef.current = "";
      setStarted(true);

      // voice mode: open the microphone right away, so it is ready for the first question
      // keyboard mode: the answer box takes the focus instead (see the focus effect below)
      if (answerMode === "voice") {
        startListening();
      }
    } catch (e) {
      console.error("Could not start the test:", e);
    } finally {
      setStarting(false);
    }
  }

  async function finishQuiz(lastAnswer: string) {
    if (finishedRef.current) return;

    console.log("FINISH: opening the level completed popup");

    finishedRef.current = true;
    exitDialogRef.current = false;
    setExitDialogOpen(false);
    setExitHintOpen(false);
    setCompleted(true);
    stopListening();

    const submitResult = await controller.submitQuiz(lastAnswer, answerMode, testMode);
    setResult(submitResult);
  }

  // back arrow while the test is running:
  //   challenge ON  -> not allowed, show the orange message
  //   challenge OFF -> ask "Stay / Exit"
  function handleBack() {
    if (!started || completed) {
      router.push("/maths");
      return;
    }

    if (challengeRunning) {
      setExitHintOpen(true);
      return;
    }

    exitDialogRef.current = true;
    setExitDialogOpen(true);
  }

  // Stay: close the popup and carry on with the test
  function stayInTest() {
    if (leaving) return;

    exitDialogRef.current = false;
    setExitDialogOpen(false);

    // keyboard mode: the focus effect puts the cursor back in the answer box
    if (answerMode === "voice") {
      startListening();
    }
  }

  // Exit: throw this attempt away and leave (nothing was saved)
  function exitTest() {
    if (leaving) return;

    setLeaving(true);
    finishedRef.current = true;
    stopListening();

    controller.discardAttempt();

    router.push("/maths");
  }

  // measures answer handed in -> next question on screen
  useEffect(() => {
    if (answerAtRef.current === null) return;

    const ms = Math.round(performance.now() - answerAtRef.current);
    answerAtRef.current = null;
    setSwitchMs((old) => [...old.slice(-99), ms]);
  }, [currentQuestionIndex]);

  /* ------------------------------ timed modes ------------------------------ */
  // 2 minute / 1 minute mode share one pool of time for the whole test.
  // Every question gets  (time left) / (questions left).
  // Answer early and the later questions get a little more time;
  // use up the whole share and the question is skipped.

  // the clock shown at the top
  useEffect(() => {
    if (!started || completed || !challengeRunning) return;

    const timer = setInterval(() => {
      const left = Math.ceil((deadlineRef.current - nowMs()) / 1000);
      setQuizSeconds(Math.max(0, left));
    }, 250);

    return () => clearInterval(timer);
  }, [started, completed, challengeRunning]);

  // moves on when this question's share of the time is over
  // (the last question gets all the time that is left, so the test ends exactly at the limit)
  useEffect(() => {
    if (!started || completed || !challengeRunning) return;

    const questionsLeft = Math.max(questions.length - currentQuestionIndex, 1);
    const timeLeft = Math.max(deadlineRef.current - nowMs(), 0);

    const timer = setTimeout(timeUp, timeLeft / questionsLeft);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, started, completed, challengeRunning, questions.length]);

  /* ------------------------------ exit handling ---------------------------- */

  // never leave a typing timer running after the page is closed
  useEffect(() => {
    return () => {
      if (typedTimerRef.current) clearTimeout(typedTimerRef.current);
    };
  }, []);

  // keyboard mode: keep the cursor in the answer box for every new question
  useEffect(() => {
    if (answerMode === "keyboard" && started && !completed && !exitDialogOpen) {
      inputRef.current?.focus();
    }
  }, [answerMode, started, completed, exitDialogOpen, currentQuestionIndex]);

  // stop the microphone while the popup is open
  useEffect(() => {
    if (exitDialogOpen) stopListening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitDialogOpen]);

  // warn on browser Back, refresh and tab close during a test
  useEffect(() => {
    if (!started || completed) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = () => {
      // put the page back in history, then react
      window.history.pushState(null, "", window.location.href);

      if (challengeRunning) {
        setExitHintOpen(true);
        return;
      }

      exitDialogRef.current = true;
      setExitDialogOpen(true);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [started, completed, challengeRunning]);

  /* ------------------- completed popup: countdown to levels ----------------- */

  // starts only after the score is saved, then goes back to the levels (like mobile)
  const countdownActive = completed && !!result && !result.error && !student.isGuest;

  useEffect(() => {
    if (!countdownActive) return;

    const timer = setInterval(() => {
      setCountdown((seconds) => seconds - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownActive]);

  useEffect(() => {
    if (countdownActive && countdown <= 0) {
      router.push("/maths");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, countdownActive]);

  /* --------------------------------- UI ------------------------------------ */

  if (isLoading) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <CircularProgress size={28} sx={{ color: TEXT }} />
        <Typography sx={{ color: TEXT_SOFT }}>Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
        <Alert severity="error" sx={darkAlertSx("error")}>
          {error}
        </Alert>
      </Box>
    );
  }

  /* ------------------------ score page (already taken) --------------------- */
  // only when the page is opened again, never while a test is running or just finished

  const alreadyCompleted = previous?.status === "Completed";

  if (!started && !completed && alreadyCompleted && !retrying) {
    const score = Number(previous?.score ?? 0);
    const total = Number(previous?.totalNoQuestions ?? questions.length);

    const info = getResultInfo(score, total);

    // a badge only exists for a good score (older saved results may have one by mistake)
    const badge = info.status === "repeat" ? "" : String(previous?.latestBadge ?? "");
    const seconds = typeof previous?.latestTotalSeconds === "number" ? previous.latestTotalSeconds : null;

    // bright colours so the result title is readable on black
    const resultColor = info.status === "repeat" ? DANGER : SUCCESS;

    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2.5, py: 4 }}>
        <Paper
          elevation={0}
          sx={{ ...cardSx, width: "100%", maxWidth: 480, p: { xs: 3, sm: 4 }, borderRadius: 6, textAlign: "center" }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: TEXT }}>
            {title} Score
          </Typography>

          <Avatar sx={{ width: 96, height: 96, bgcolor: CARD_SOFT, fontSize: 48, mx: "auto", mb: 2 }}>
            {info.icon}
          </Avatar>

          <Typography sx={{ mb: 1, color: TEXT_SOFT }}>Your Score</Typography>

          <Typography variant="h2" sx={{ fontWeight: 700, color: TEXT }}>
            {score} / {total}
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 700, color: resultColor, mt: 1, mb: 2 }}>
            {info.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "center", mb: 2 }}>
            {badge && (
              <Chip
                label={`${getBadgeIcon(badge)} ${badge}`}
                variant="outlined"
                sx={badgeChipSx}
              />
            )}

            {seconds !== null && (
              <Chip
                icon={<TimerOutlinedIcon />}
                label={formatTime(seconds)}
                variant="outlined"
                sx={timeChipSx}
              />
            )}
          </Stack>

          <Alert severity={info.severity} sx={darkAlertSx(info.severity, { mb: 3, textAlign: "left" })}>
            {info.message}
          </Alert>

          <Stack spacing={1.5}>
            <Button fullWidth size="large" variant="contained" onClick={() => setRetrying(true)} sx={mainButtonSx}>
              Retry Test
            </Button>

            <Button fullWidth size="large" variant="outlined" onClick={() => router.push("/maths")} sx={outlinedButtonSx}>
              Back to Levels
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  /* ----------------------------- instructions ------------------------------ */

  if (!started && !completed) {
    return (
      <Box sx={{ ...pageSx, px: 2.5, py: 4 }}>
        <Container maxWidth="sm" disableGutters>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <IconButton
              aria-label="Back"
              sx={{ color: TEXT }}
              onClick={() => (retrying ? setRetrying(false) : router.push("/maths"))}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: "center", flex: 1, pr: 5, color: TEXT }}>
              Instructions
            </Typography>
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 3, borderRadius: 6 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: TEXT }}>
              {title}
            </Typography>

            {student.isGuest && (
              <Alert severity="info" sx={darkAlertSx("info", { mb: 2 })}>
                You are not logged in, so your answers will not be saved.
              </Alert>
            )}

            {retrying && (
              <Alert severity="warning" sx={darkAlertSx("warning", { mb: 2 })}>
                Your previous result stays until you finish this attempt. Then it moves to your
                history.
              </Alert>
            )}

            {/* ---------------------- answer mode: voice or keyboard ---------------------- */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: TEXT }}>
              Answer Mode
            </Typography>

            <ToggleButtonGroup
              exclusive
              fullWidth
              value={answerMode}
              onChange={(_, value: AnswerMode | null) => {
                if (value) setAnswerMode(value);
              }}
              sx={{
                mb: 1,
                "& .MuiToggleButton-root": {
                  py: 1.25,
                  gap: 1,
                  color: TEXT_SOFT,
                  borderColor: BORDER,
                  textTransform: "none",
                  fontWeight: 700,
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  bgcolor: "#fff",
                  color: "#000",
                },
                "& .MuiToggleButton-root.Mui-selected:hover": { bgcolor: "#e5e5e5" },
              }}
            >
              <ToggleButton value="voice">
                <MicIcon fontSize="small" /> Voice
              </ToggleButton>

              <ToggleButton value="keyboard">
                <KeyboardIcon fontSize="small" /> Keyboard
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography sx={{ mb: 3, color: TEXT_SOFT }}>
              {answerMode === "voice"
                ? "Speak each answer into the microphone."
                : "Type each answer. It moves to the next question by itself."}
            </Typography>

            {/* ---------------------- test mode: own pace / 2 minute / 1 minute ---------------------- */}
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: TEXT }}>
              Test Mode
            </Typography>

            <ToggleButtonGroup
              exclusive
              fullWidth
              value={testMode}
              onChange={(_, value: TestMode | null) => {
                if (value) setTestMode(value);
              }}
              sx={{
                mb: 1,
                "& .MuiToggleButton-root": {
                  py: 1.25,
                  gap: 0.75,
                  color: TEXT_SOFT,
                  borderColor: BORDER,
                  textTransform: "none",
                  fontWeight: 700,
                },
                "& .MuiToggleButton-root.Mui-selected": {
                  bgcolor: "#fff",
                  color: "#000",
                },
                "& .MuiToggleButton-root.Mui-selected:hover": { bgcolor: "#e5e5e5" },
              }}
            >
              <ToggleButton value="ownPace">Own pace</ToggleButton>
              <ToggleButton value="twoMinute">
                <TimerOutlinedIcon fontSize="small" /> 2 min
              </ToggleButton>
              <ToggleButton value="oneMinute">
                <TimerOutlinedIcon fontSize="small" /> 1 min
              </ToggleButton>
            </ToggleButtonGroup>

            <Typography sx={{ mb: testMode === "oneMinute" && answerMode === "voice" ? 1 : 3, color: TEXT_SOFT }}>
              {TEST_MODE_HELP[testMode]}
            </Typography>

            {testMode === "oneMinute" && answerMode === "voice" && (
              <Alert severity="warning" sx={darkAlertSx("warning", { mb: 3 })}>
                You get only 1 second per question. 
              </Alert>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: TEXT }}>
              General
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {GENERAL_LINES.map((line) => (
                <Typography key={line} sx={{ color: TEXT_SOFT }}>
                  {line}
                </Typography>
              ))}
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: TEXT }}>
              Specifics
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {SPECIFIC_LINES.map((line) => (
                <Typography key={line} sx={{ color: TEXT_SOFT }}>
                  {line}
                </Typography>
              ))}
            </Stack>

            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={starting}
              onClick={startQuiz}
              sx={mainButtonSx}
            >
              {starting ? "Starting..." : "Start"}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  /* ---------------------------------- quiz --------------------------------- */
  // (after the test is finished this screen stays behind the "Level completed" popup)

  const current = questions[currentQuestionIndex];

  const micText = heardText
    ? heardText
    : listening
    ? micReady
      ? "Speak now..."
      : "Starting microphone..."
    : "Tap microphone to speak your answer...";

  const guest = student.isGuest;
  const resultInfo = getResultInfo(totalScore, questions.length);
  const resultBadge = result?.badge ?? "";

  return (
    <Box sx={pageSx}>
      <Container maxWidth="md" sx={{ py: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <IconButton
            aria-label="Back"
            onClick={handleBack}
            disabled={leaving}
            sx={{ color: TEXT, "&.Mui-disabled": { color: "rgba(255,255,255,0.3)" } }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center", flex: 1, px: 1, color: TEXT }}>
            {title}
          </Typography>

          <Box sx={{ textAlign: "right", minWidth: 84 }}>
            {challengeRunning && (
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block", color: DANGER }}>
                Quiz : {formatTime(quizSeconds)}
              </Typography>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT }}>
              {currentQuestionIndex + 1}/{questions.length}
            </Typography>
          </Box>
        </Box>

        {challengeRunning && (
          <LinearProgress
            variant="determinate"
            value={(quizSeconds / (testSeconds || 1)) * 100}
            sx={{
              mb: 3,
              height: 8,
              borderRadius: 4,
              bgcolor: "rgba(255,255,255,0.15)",
              "& .MuiLinearProgress-bar": { bgcolor: quizSeconds <= 10 ? DANGER : "#fff" },
            }}
          />
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Chip
            icon={<TimerOutlinedIcon />}
            label={formatTime(totalElapsedSeconds)}
            variant="outlined"
            sx={{
              height: 48,
              px: 1,
              fontSize: 18,
              fontWeight: 700,
              borderWidth: 2,
              borderColor: TEXT,
              color: TEXT,
              "& .MuiChip-icon": { color: TEXT },
            }}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{ ...cardSx, p: { xs: 4, sm: 5 }, textAlign: "center", borderRadius: 6, mb: 5 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "3rem" }, color: TEXT }}>
            {current?.question}
          </Typography>
        </Paper>

        {answerMode === "keyboard" ? (
          <Card elevation={0} sx={{ ...cardSx, borderRadius: 6, p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <TextField
                fullWidth
                autoFocus
                inputRef={inputRef}
                value={typedAnswer}
                placeholder="Type your answer..."
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitTyped();
                  }
                }}
                slotProps={{
                  htmlInput: {
                    autoComplete: "off",
                    style: { color: TEXT, fontSize: 24, fontWeight: 700 },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: BORDER },
                  "& .Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#fff" },
                  "& input::placeholder": { color: TEXT_SOFT, opacity: 1 },
                }}
              />

              <Button
                variant="contained"
                disabled={!typedAnswer.trim()}
                onClick={submitTyped}
                endIcon={<ArrowForwardIcon />}
                sx={{ ...mainButtonSx, px: 3, whiteSpace: "nowrap" }}
              >
                {currentQuestionIndex >= questions.length - 1 ? "Submit" : "Next"}
              </Button>
            </Stack>
          </Card>
        ) : (
        <Card elevation={0} sx={{ ...cardSx, borderRadius: 6 }}>
          <CardActionArea
            onClick={startListening}
            disabled={listening}
            sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, color: TEXT }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: heardText ? TEXT : TEXT_SOFT }}>
              {micText}
            </Typography>

            {/* orange mic button stays the same, it looks good on black */}
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: listening && micReady ? "#fdba74" : "#ffedd5",
                color: "#c2410c",
                animation: listening && micReady ? `${pulse} 1.4s infinite` : "none",
              }}
            >
              <MicIcon fontSize="large" />
            </Avatar>
          </CardActionArea>
        </Card>
        )}

      {/* Deepgram test only: how fast the answers come back */}
        {answerMode === "voice" && USE_DEEPGRAM && SHOW_VOICE_DEBUG && voiceStats && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontVariantNumeric: "tabular-nums" }}>
              You stop speaking to answer handed in: last {voiceStats.lastFinalMs ?? "-"} ms, median{" "}
              {voiceStats.medianFinalMs ?? "-"} ms
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontVariantNumeric: "tabular-nums" }}>
              Answer handed in to next question on screen: last {switchMs[switchMs.length - 1] ?? "-"} ms, median{" "}
              {medianOf(switchMs) ?? "-"} ms
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontVariantNumeric: "tabular-nums" }}>
              First words {voiceStats.medianFirstTextMs ?? "-"} ms, connect {voiceStats.connectMs ?? "-"} ms,{" "}
              {voiceStats.count} heard ({voiceStats.fastCount} fast, {voiceStats.safeCount} safe, {voiceStats.finalCount} by Deepgram signal)
            </Typography>

            <Button
              size="small"
              sx={{ textTransform: "none", fontWeight: 700, color: "#000", minWidth: 0, px: 0 }}
              onClick={() =>
                navigator.clipboard.writeText(JSON.stringify({ voiceStats, switchMs, timings }, null, 2))
              }
            >
              Copy timings
            </Button>
          </Box>
        )}

        {answerMode === "voice" && micMessage && (
          <Alert severity="error" variant="outlined" sx={darkAlertSx("error", { mt: 2 })}>
            {micMessage}
          </Alert>
        )}
      </Container>

      {/* Exit popup (challenge OFF) */}
      <ExitQuizDialog
        open={exitDialogOpen}
        leaving={leaving}
        onStay={stayInTest}
        onExit={exitTest}
      />

      {/* "You cannot leave" message (challenge ON) */}
      <Snackbar
        open={exitHintOpen}
        autoHideDuration={3000}
        onClose={() => setExitHintOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box
          sx={{
            bgcolor: "#ff9800",
            color: "#fff",
            borderRadius: 2,
            px: 2.5,
            py: 1.5,
            width: "100%",
            maxWidth: 480,
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>Timed Test</Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            You cannot leave until the timer finishes.
          </Typography>
        </Box>
      </Snackbar>

      {/* --------------------------- level completed ---------------------------- */}
      <Dialog
        open={completed}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { ...cardSx, borderRadius: 3, p: 0.5 } } }}
      >
        <DialogContent sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: TEXT }}>
            {guest ? "Quiz completed" : "Level completed"}
          </Typography>

          {guest ? (
            <Typography sx={{ color: TEXT_SOFT }}>Log in to save your progress and view activity.</Typography>
          ) : (
            <>
              <Avatar sx={{ width: 72, height: 72, bgcolor: CARD_SOFT, fontSize: 38, mx: "auto", mb: 1.5 }}>
                {resultInfo.icon}
              </Avatar>

              <Paper
                elevation={0}
                sx={{ py: 1.5, borderRadius: 2.5, bgcolor: CARD_SOFT, backgroundImage: "none", border: `1px solid ${BORDER}`, mb: 1.5 }}
              >
                <Typography variant="body2" sx={{ color: TEXT_SOFT }}>
                  Your score
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT, ...numSx }}>
                  {totalScore} / {questions.length}
                </Typography>
              </Paper>

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
                  {resultBadge && (
                    <Chip
                      label={`${getBadgeIcon(resultBadge)} ${resultBadge}`}
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

              {countdownActive && countdown > 0 && (
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
                    value={(countdown / COUNTDOWN_START) * 100}
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
                    <Typography sx={{ fontWeight: 800, fontSize: 16, color: TEXT }}>{countdown}</Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{ px: 3, pb: 2.5, flexDirection: "column", gap: 1, "& > :not(style) ~ :not(style)": { ml: 0 } }}
        >
          {guest ? (
            <>
              <Button fullWidth variant="contained" onClick={() => router.push("/")} sx={mainButtonSx}>
                Log in
              </Button>

              <Button fullWidth variant="outlined" onClick={() => router.push("/maths")} sx={outlinedButtonSx}>
                Close
              </Button>
            </>
          ) : (
            <Button
              fullWidth
              variant="contained"
              disabled={!result}
              endIcon={result?.nextLevel ? <ArrowForwardIcon /> : <HomeIcon />}
              onClick={() =>
                result?.nextLevel ? router.push(nextLevelPath(result.nextLevel)) : router.push("/maths")
              }
              sx={mainButtonSx}
            >
              {result?.nextLevel ? "Move to Next Level" : "Back to Home"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}