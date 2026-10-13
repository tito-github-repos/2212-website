// src/lib/quizRules.ts
// ONE place for every quiz rule (scores, seconds, badges, icons, messages).
// No Firebase here, so the pages, the controller and the service can all import it.

/* ------------------------------- the rules -------------------------------- */

// the whole test (60 questions) must be finished in less than:
export const EXCELLENT_UNDER = 30; // seconds
export const VERY_GOOD_UNDER = 60;
export const GOOD_UNDER = 120;

// 60/60 is the target, 59/58 is ok, 57 or less -> repeat the test
export const ALLOWED_WRONG = 2;

export type ResultStatus = "perfect" | "ok" | "repeat";

/* -------------------------------- icons ----------------------------------- */

export const BADGE_ICONS: Record<string, string> = {
  Excellent: "🏆",
  "Very Good": "⭐",
  Good: "👍",
};

export function getBadgeIcon(badge: string) {
  return BADGE_ICONS[badge] ?? "";
}

/* ------------------------------- helpers ---------------------------------- */

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

/* -------------------------------- badges ---------------------------------- */

// badge of a single question (seconds of that question only)
export function calculateQuestionBadge(secondsTaken: number, isCorrect: boolean) {
  if (!isCorrect) return "";
  if (secondsTaken < 30) return "Excellent";
  if (secondsTaken < 60) return "Very Good";
  if (secondsTaken < 120) return "Good";
  return "";
}

export function getResultStatus(score: number, total: number): ResultStatus {
  if (total > 0 && score >= total) return "perfect";
  if (total > 0 && total - score <= ALLOWED_WRONG) return "ok";
  return "repeat";
}

// badge of the whole test: the score must be good first, then the TOTAL time decides
export function calculateBadge(score: number, total: number, totalSeconds: number) {
  const status = getResultStatus(score, total);

  if (status === "repeat") return "";

  let badge = "";

  if (totalSeconds < EXCELLENT_UNDER) badge = "Excellent";
  else if (totalSeconds < VERY_GOOD_UNDER) badge = "Very Good";
  else if (totalSeconds < GOOD_UNDER) badge = "Good";

  // only a full score can be Excellent
  if (status === "ok" && badge === "Excellent") badge = "Very Good";

  return badge;
}

/* ------------------------- text and colours for screens -------------------- */

export type ResultInfo = {
  status: ResultStatus;
  icon: string;
  title: string;
  message: string;
  color: "success.main" | "error.main";
  severity: "success" | "info";
};

export function getResultInfo(score: number, total: number): ResultInfo {
  const status = getResultStatus(score, total);

  if (status === "perfect") {
    return {
      status,
      icon: "🏆",
      title: "Perfect Score!",
      message: `Full score of ${total} out of ${total}. Brilliant!`,
      color: "success.main",
      severity: "success",
    };
  }

  if (status === "ok") {
    return {
      status,
      icon: "👍",
      title: "Good Job!",
      message: `Very close! Getting ${total} out of ${total} is our target.`,
      color: "success.main",
      severity: "info",
    };
  }

  return {
    status,
    icon: "🔄",
    title: "Try Again",
    message: "You can repeat this test! Practice more to improve your score and get a better badge!",
    color: "error.main",
    severity: "info",
  };
}