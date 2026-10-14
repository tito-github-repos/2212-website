//src\app\maths\[level]\page.tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import { keyframes } from "@emotion/react";
import Alert from "@mui/material/Alert";
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
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HomeIcon from "@mui/icons-material/Home";
import MicIcon from "@mui/icons-material/Mic";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { formatTime, getBadgeIcon, getResultInfo } from "../../../lib/quizRules";
import { type LevelInfo } from "../../../lib/questionService";
import { useVoiceAnswer } from "../../../lib/useVoiceAnswer";
import {
  useQuestionController,
  type SubmitResult,
} from "../../../lib/useQuestionController";
import ExitQuizDialog from "@/app/components/ExitQuizDialog";

const SUBJECT = "Maths";
const COUNTDOWN_START = 5; // seconds shown in the completed popup before going to the levels

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

const pageSx = { minHeight: "100vh", bgcolor: "#fff", color: "text.primary" };

const numSx = { fontVariantNumeric: "tabular-nums", letterSpacing: -1 };

const blackButtonSx = {
  py: 1.75,
  borderRadius: 4,
  bgcolor: "#000",
  color: "#fff",
  "&:hover": { bgcolor: "#222" },
};

const outlinedButtonSx = {
  py: 1.5,
  borderRadius: 4,
  color: "#000",
  borderColor: "#000",
  "&:hover": { borderColor: "#000", bgcolor: "grey.100" },
};

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

  // exit popup (used when the 1 minute challenge is OFF)
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const exitDialogRef = useRef(false);

  // 1 minute challenge
  const [oneMinuteMode, setOneMinuteMode] = useState(false);
  const [quizSeconds, setQuizSeconds] = useState(60);
  const [challengeRunning, setChallengeRunning] = useState(false); // fixed when the test starts
  const [exitHintOpen, setExitHintOpen] = useState(false); // orange "cannot leave" message

  // countdown shown in the "Level completed" popup
  const [countdown, setCountdown] = useState(COUNTDOWN_START);

  const finishedRef = useRef(false);

  const title = titleFromUrl || questions[0]?.category || "Addition";

  /* ------------------------------- voice ---------------------------------- */

  const { listening, heardText, micMessage, micReady, startListening, stopListening, clearHeard } =
    useVoiceAnswer({
      onAnswer: (text) => handleAnswer(text),
      getCorrectAnswer: () => controller.getCorrectAnswer(),
      canListen: () => !finishedRef.current,
    });

  function handleAnswer(text: string) {
    if (finishedRef.current || exitDialogRef.current) return;

    if (controller.isLastQuestion()) {
      void finishQuiz(text);
      return;
    }

    controller.nextQuestion(text);
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
      setChallengeRunning(oneMinuteMode);
      setResult(null);
      setCompleted(false);
      setCountdown(COUNTDOWN_START);
      setQuizSeconds(60);
      clearHeard();
      setStarted(true);

      // open the microphone right away, so it is ready for the first question
      startListening();
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

    const submitResult = await controller.submitQuiz(lastAnswer);
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
    startListening();
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

  /* ------------------------------ 1 minute mode ---------------------------- */

  useEffect(() => {
    if (!started || completed || !challengeRunning) return;

    const timer = setInterval(() => {
      setQuizSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed, challengeRunning]);

  useEffect(() => {
    if (started && !completed && challengeRunning && quizSeconds === 0) {
      void finishQuiz("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizSeconds, started, completed, challengeRunning]);

  /* ------------------------------ exit handling ---------------------------- */

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
        <CircularProgress size={28} sx={{ color: "#000" }} />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
        <Alert severity="error">{error}</Alert>
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

    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2.5, py: 4 }}>
        <Paper elevation={8} sx={{ width: "100%", maxWidth: 480, p: { xs: 3, sm: 4 }, borderRadius: 6, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            {title} Score
          </Typography>

          <Avatar sx={{ width: 96, height: 96, bgcolor: "grey.100", fontSize: 48, mx: "auto", mb: 2 }}>
            {info.icon}
          </Avatar>

          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Your Score
          </Typography>

          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            {score} / {total}
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 700, color: info.color, mt: 1, mb: 2 }}>
            {info.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "center", mb: 2 }}>
            {badge && (
              <Chip
                label={`${getBadgeIcon(badge)} ${badge}`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}

            {seconds !== null && (
              <Chip
                icon={<TimerOutlinedIcon />}
                label={formatTime(seconds)}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>

          <Alert severity={info.severity} sx={{ mb: 3, textAlign: "left" }}>
            {info.message}
          </Alert>

          <Stack spacing={1.5}>
            <Button fullWidth size="large" variant="contained" onClick={() => setRetrying(true)} sx={blackButtonSx}>
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
              onClick={() => (retrying ? setRetrying(false) : router.push("/maths"))}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: "center", flex: 1, pr: 5 }}>
              Instructions
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 6, bgcolor: "grey.50", borderColor: "grey.200" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {title}
            </Typography>

            {student.isGuest && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You are not logged in, so your answers will not be saved.
              </Alert>
            )}

            {retrying && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Your previous result stays until you finish this attempt. Then it moves to your
                history.
              </Alert>
            )}

            {/* -------------------------start 1 minute mode --------------------- */}
            {/* <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Enable 1 Minute Mode
            </Typography>

            <FormControlLabel
              labelPlacement="start"
              sx={{ m: 0, mb: 3, width: "100%", justifyContent: "space-between" }}
              control={
                <Switch
                  checked={oneMinuteMode}
                  onChange={(e) => setOneMinuteMode(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#000" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#000",
                    },
                  }}
                />
              }
              label={
                <Typography color="text.secondary" sx={{ pr: 2 }}>
                  Automatically save after 1 minute whether you answered all questions or not.
                  You cannot leave the test until the timer finishes.
                </Typography>
              }
            /> */}

       {/* --------------------end 1 minite module -------------------      */}

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              General
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {GENERAL_LINES.map((line) => (
                <Typography key={line} color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Specifics
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {SPECIFIC_LINES.map((line) => (
                <Typography key={line} color="text.secondary">
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
              sx={blackButtonSx}
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
          <IconButton aria-label="Back" onClick={handleBack} disabled={leaving}>
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center", flex: 1, px: 1 }}>
            {title}
          </Typography>

          <Box sx={{ textAlign: "right", minWidth: 84 }}>
            {challengeRunning && (
              <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: "block" }}>
                Quiz : {formatTime(quizSeconds)}
              </Typography>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {currentQuestionIndex + 1}/{questions.length}
            </Typography>
          </Box>
        </Box>

        {challengeRunning && (
          <LinearProgress
            variant="determinate"
            value={(quizSeconds / 60) * 100}
            sx={{
              mb: 3,
              height: 8,
              borderRadius: 4,
              bgcolor: "grey.200",
              "& .MuiLinearProgress-bar": { bgcolor: quizSeconds <= 10 ? "#dc2626" : "#000" },
            }}
          />
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Chip
            icon={<TimerOutlinedIcon />}
            label={formatTime(totalElapsedSeconds)}
            variant="outlined"
            sx={{ height: 48, px: 1, fontSize: 18, fontWeight: 700, borderWidth: 2, borderColor: "text.primary" }}
          />
        </Box>

        <Paper elevation={6} sx={{ p: { xs: 4, sm: 5 }, textAlign: "center", borderRadius: 6, mb: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "3rem" } }}>
            {current?.question}
          </Typography>
        </Paper>

        <Card elevation={6} sx={{ borderRadius: 6 }}>
          <CardActionArea
            onClick={startListening}
            disabled={listening}
            sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }} color={heardText ? "text.primary" : "text.secondary"}>
              {micText}
            </Typography>

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

        {micMessage && (
          <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
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
          <Typography sx={{ fontWeight: 700 }}>1 Minute Challenge</Typography>
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
        slotProps={{ paper: { sx: { borderRadius: 3, p: 0.5 } } }}
      >
        <DialogContent sx={{ textAlign: "center", pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
            {guest ? "Quiz completed" : "Level completed"}
          </Typography>

          {guest ? (
            <Typography color="text.secondary">Log in to save your progress and view activity.</Typography>
          ) : (
            <>
              <Avatar sx={{ width: 72, height: 72, bgcolor: "grey.100", fontSize: 38, mx: "auto", mb: 1.5 }}>
                {resultInfo.icon}
              </Avatar>

              <Paper
                variant="outlined"
                sx={{ py: 1.5, borderRadius: 2.5, bgcolor: "grey.50", borderColor: "grey.200", mb: 1.5 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Your score
                </Typography>

                <Typography variant="h4" sx={{ fontWeight: 800, ...numSx }}>
                  {totalScore} / {questions.length}
                </Typography>
              </Paper>

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
                  {resultBadge && (
                    <Chip
                      label={`${getBadgeIcon(resultBadge)} ${resultBadge}`}
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

              {countdownActive && countdown > 0 && (
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
                    value={(countdown / COUNTDOWN_START) * 100}
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
          sx={{ px: 3, pb: 2.5, flexDirection: "column", gap: 1, "& > :not(style) ~ :not(style)": { ml: 0 } }}
        >
          {guest ? (
            <>
              <Button fullWidth variant="contained" onClick={() => router.push("/")} sx={blackButtonSx}>
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
              sx={blackButtonSx}
            >
              {result?.nextLevel ? "Move to Next Level" : "Back to Home"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}