// src/lib/questionService.ts
// All Firestore work for the quiz. It uses the SAME collections and field names as the
// Flutter app, so the mobile app and the website can share the same student data.
// Scores, seconds and badge rules are NOT here, they live in ./quizRules.

import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth, db } from "./firebase";
import { areAnswersEquivalent } from "./answerMatch";
import { calculateQuestionBadge } from "./quizRules";

// kept here so older imports keep working
export { calculateQuestionBadge, calculateBadge } from "./quizRules";

export const CATEGORY = "QuestionCategory";

export type QuestionItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
  category: string;
};

export type Student = {
  id: string;
  email: string | null;
  isGuest: boolean;
};

export type LevelInfo = {
  levelId: string;
  categoryName: string;
};

// how the student answered the test: speaking or typing
export type AnswerMode = "voice" | "keyboard";

// ownPace = moves when the student answers; twoMinute / oneMinute = all questions move within 120 / 60 seconds
export type TestMode = "ownPace" | "twoMinute" | "oneMinute";

export type ScoreData = {
  latestAnswerMode?: AnswerMode;
  latestTestMode?: TestMode;
  latestPlatform?: string; // "web" here, "mobile" from the mobile app
  score?: number;
  totalNoQuestions?: number;
  status?: string;
  categoryName?: string;
  level?: string;
  latestBadge?: string;
  latestAttemptNo?: number;
  latestTotalSeconds?: number;
  latestAverageSeconds?: number;
  latestAttemptStartTime?: Timestamp;
  latestAttemptEndTime?: Timestamp;
  [key: string]: unknown;
};

/* ------------------------------ references ------------------------------ */

const answersCol = (studentId: string, subject: string, level: string) =>
  collection(db, "StudentAnswerSheet", studentId, subject, CATEGORY, level);

const scoreRef = (studentId: string, subject: string, level: string) =>
  doc(db, "StudentScoreSheet", studentId, subject, CATEGORY, level, "scoreData");

async function deleteInChunks(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 400) {
    const batch = writeBatch(db);
    refs.slice(i, i + 400).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/* -------------------------------- student -------------------------------- */

// waits until Firebase has restored the logged-in user (null = guest)
export function waitForUser(): Promise<User | null> {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

// same rule as the mobile app: StudentRegister document id, otherwise the login uid
export async function getStudent(): Promise<Student> {
  const user = await waitForUser();

  if (!user) {
    return { id: "", email: null, isGuest: true };
  }

  let id = user.uid;

  try {
    const snapshot = await getDocs(
      query(
        collection(db, "StudentRegister"),
        where("email", "==", user.email),
        limit(1)
      )
    );

    if (!snapshot.empty) {
      id = snapshot.docs[0].id;
    }
  } catch (error) {
    console.error("Error getting student:", error);
  }

  return { id, email: user.email, isGuest: false };
}

/* ------------------------------- questions ------------------------------- */

export async function fetchQuestions(subject: string, level: string) {
  const levelSnap = await getDoc(
    doc(db, "QuestionBank", subject, "QuestionCategory", level)
  );

  if (!levelSnap.exists()) {
    throw new Error("Level not found");
  }

  const rawCategories = levelSnap.data()?.categories;
  const categories: string[] = Array.isArray(rawCategories)
    ? rawCategories.map(String)
    : [];

  const items: QuestionItem[] = [];

  for (const category of categories) {
    const snapshot = await getDocs(
      query(
        collection(db, "QuestionBank", subject, "QuestionCategory", level, category),
        orderBy("order")
      )
    );

    snapshot.forEach((questionDoc) => {
      const data = questionDoc.data();

      items.push({
        id: questionDoc.id,
        question: String(data.question ?? ""),
        answer: String(data.answer ?? ""),
        order: Number(data.order ?? 0),
        category,
      });
    });
  }

  // the mobile app sorts all categories together by "order"
  items.sort((a, b) => a.order - b.order);

  return items;
}

export async function getAvailableLevelsWithCategories(
  subject: string
): Promise<LevelInfo[]> {
  const snapshot = await getDocs(
    collection(db, "QuestionBank", subject, "QuestionCategory")
  );

  const levels: LevelInfo[] = [];

  snapshot.forEach((item) => {
    const categories = item.data().categories;

    levels.push({
      levelId: item.id,
      categoryName:
        Array.isArray(categories) && categories.length > 0
          ? String(categories[0])
          : item.id,
    });
  });

  levels.sort((a, b) => {
    const numberA = parseInt(a.levelId.replace(/\D/g, ""), 10) || 0;
    const numberB = parseInt(b.levelId.replace(/\D/g, ""), 10) || 0;
    return numberA - numberB;
  });

  return levels;
}

/* --------------------------- answers and scores --------------------------- */

// answers saved earlier, as a list in question order ("" = not answered)
export async function fetchSavedAnswers(
  studentId: string,
  subject: string,
  level: string,
  count: number
) {
  const answers: string[] = new Array(count).fill("");

  const snapshot = await getDocs(answersCol(studentId, subject, level));

  snapshot.forEach((answerDoc) => {
    const number = parseInt(answerDoc.id.replace("Q", ""), 10);

    if (number > 0 && number <= count) {
      answers[number - 1] = String(answerDoc.data().answer ?? "");
    }
  });

  return answers;
}

// first unanswered question, or the last one when everything is answered
export function firstUnansweredIndex(answers: string[]) {
  const index = answers.findIndex((answer) => answer === "");
  return index === -1 ? Math.max(answers.length - 1, 0) : index;
}

export async function fetchScoreData(
  studentId: string,
  subject: string,
  level: string
): Promise<ScoreData | null> {
  const snapshot = await getDoc(scoreRef(studentId, subject, level));
  return snapshot.exists() ? (snapshot.data() as ScoreData) : null;
}

export async function saveAnswerDoc(params: {
  studentId: string;
  subject: string;
  level: string;
  index: number;
  question: string;
  correctAnswer: string;
  answer: string;
  isSubmit: boolean;
  secondsTaken: number;
  startedAt: Date;
}) {
  const isCorrect = areAnswersEquivalent(params.answer, params.correctAnswer);

  console.log(
    `Check Q${params.index + 1}: said "${params.answer}" | correct "${params.correctAnswer}" | ${
      isCorrect ? "PASS" : "FAIL"
    }`
  );

  await setDoc(
    doc(
      db,
      "StudentAnswerSheet",
      params.studentId,
      params.subject,
      CATEGORY,
      params.level,
      `Q${params.index + 1}`
    ),
    {
      question: params.question,
      answer: params.answer,
      correctAnswer: params.correctAnswer,
      score: isCorrect ? 1 : 0,
      scoreText: isCorrect ? "Pass" : "Fail",
      badge: calculateQuestionBadge(params.secondsTaken, isCorrect),
      latestAttemptStartTime: Timestamp.fromDate(params.startedAt),
      latestAttemptEndTime: Timestamp.fromDate(new Date()),
      latestSecondsTaken: params.secondsTaken,
      attemptDateTime: serverTimestamp(),
      isSubmit: params.isSubmit,
    },
    { merge: true }
  );

  return isCorrect;
}

// total of the seconds saved per question (used when a half-finished test is continued)
export async function sumSecondsTaken(
  studentId: string,
  subject: string,
  level: string
) {
  const snapshot = await getDocs(answersCol(studentId, subject, level));

  let total = 0;

  snapshot.forEach((answerDoc) => {
    total += Number(answerDoc.data().latestSecondsTaken ?? 0);
  });

  return total;
}

/* ----------------------------- attempt history ---------------------------- */

// 1, 2, 3 ... based on the highest attempt already in attemptHistory
export async function getNextAttemptNumber(
  studentId: string,
  subject: string,
  level: string
) {
  try {
    const snapshot = await getDocs(
      collection(scoreRef(studentId, subject, level), "attemptHistory")
    );

    if (snapshot.empty) return 1;

    let max = 0;

    snapshot.forEach((historyDoc) => {
      const attemptNo = Number(historyDoc.data().attemptNo ?? 0);
      if (attemptNo > max) max = attemptNo;
    });

    return max + 1;
  } catch (error) {
    console.error("Error getting next attempt number:", error);
    return 1;
  }
}

// copies the finished score into attemptHistory (only when the test was Completed)
export async function moveScoreToAttemptHistory(
  studentId: string,
  subject: string,
  level: string
) {
  const ref = scoreRef(studentId, subject, level);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) return;

  const data = snapshot.data();

  if (data.status !== "Completed") return;

  const attemptNo = data.latestAttemptNo ?? 1;

  await setDoc(doc(collection(ref, "attemptHistory"), `attempt_${attemptNo}`), {
    score: data.score ?? 0,
    totalNoQuestions: data.totalNoQuestions ?? 0,
    badge: data.latestBadge ?? "",
    totalSeconds: data.latestTotalSeconds ?? 0,
    averageSeconds: data.latestAverageSeconds ?? 0,
    attemptNo,
    // attempts saved before these fields existed: all were voice, device unknown
    answerMode: data.latestAnswerMode ?? "voice",
    platform: data.latestPlatform ?? "unknown",
    // attempts saved before test modes existed were all own pace
    testMode: data.latestTestMode ?? "ownPace",
    attemptStartTime: data.latestAttemptStartTime ?? null,
    attemptEndTime: data.latestAttemptEndTime ?? null,
    status: "Completed",
    categoryName: data.categoryName ?? level,
    movedToHistoryAt: serverTimestamp(),
  });
}

// copies every answer of the previous attempt into its attemptHistory
export async function moveAnswersToAttemptHistory(
  studentId: string,
  subject: string,
  level: string
) {
  const previousAttemptNo = (await getNextAttemptNumber(studentId, subject, level)) - 1;

  if (previousAttemptNo < 1) return; // there is no earlier attempt

  const snapshot = await getDocs(answersCol(studentId, subject, level));

  for (let i = 0; i < snapshot.docs.length; i += 400) {
    const batch = writeBatch(db);

    snapshot.docs.slice(i, i + 400).forEach((answerDoc) => {
      const data = answerDoc.data();

      batch.set(
        doc(
          db,
          "StudentAnswerSheet",
          studentId,
          subject,
          CATEGORY,
          level,
          answerDoc.id,
          "attemptHistory",
          `attempt_${previousAttemptNo}`
        ),
        {
          answer: data.answer ?? "",
          attemptNo: previousAttemptNo,
          attemptStartTime: data.latestAttemptStartTime ?? null,
          attemptEndTime: data.latestAttemptEndTime ?? null,
          badge: data.badge ?? "",
          isCorrect: (data.score ?? 0) === 1,
          score: data.score ?? 0,
          secondsTaken: data.latestSecondsTaken ?? 0,
          correctAnswer: data.correctAnswer ?? null,
          question: data.question ?? null,
        }
      );
    });

    await batch.commit();
  }
}

export async function deleteAllAnswers(
  studentId: string,
  subject: string,
  level: string
) {
  const snapshot = await getDocs(answersCol(studentId, subject, level));
  await deleteInChunks(snapshot.docs.map((answerDoc) => answerDoc.ref));
}

/* ------------------------------- score sheet ------------------------------ */

export async function updateScoreSheet(params: {
  studentId: string;
  subject: string;
  level: string;
  score: number;
  badge: string;
  totalSeconds: number;
  attemptNo: number;
  totalQuestions: number;
  categoryName: string;
  startedAt?: Date;
  answerMode?: AnswerMode;
  testMode?: TestMode;
}) {
  await setDoc(
    scoreRef(params.studentId, params.subject, params.level),
    {
      studentId: params.studentId,
      subject: params.subject,
      category: CATEGORY,
      level: params.level,
      score: params.score,
      categoryName: params.categoryName,
      totalNoQuestions: params.totalQuestions,
      status: "Completed",
      latestBadge: params.badge,
      latestTotalSeconds: params.totalSeconds,
      latestAverageSeconds:
        params.totalQuestions > 0
          ? Math.floor(params.totalSeconds / params.totalQuestions)
          : 0,
      latestAttemptNo: params.attemptNo,
      latestAnswerMode: params.answerMode ?? "voice",
      latestTestMode: params.testMode ?? "ownPace",
      latestPlatform: "web", // this code only runs on the website
      latestAttemptStartTime: params.startedAt
        ? Timestamp.fromDate(params.startedAt)
        : serverTimestamp(),
      latestAttemptEndTime: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// "Save and close": the test stays InProgress, like on mobile
export async function saveInProgress(
  studentId: string,
  subject: string,
  level: string,
  categoryName: string
) {
  await setDoc(
    scoreRef(studentId, subject, level),
    {
      studentId,
      categoryName,
      subject,
      category: CATEGORY,
      level,
      status: "InProgress",
      updatedAt: serverTimestamp(),
      latestAttemptNo: deleteField(),
      score: deleteField(),
      latestBadge: deleteField(),
      latestTotalSeconds: deleteField(),
      latestAverageSeconds: deleteField(),
    },
    { merge: true }
  );
}

// wipes everything of one level (answers, histories and the score)
export async function resetFullLevel(
  studentId: string,
  subject: string,
  level: string
) {
  const refs: DocumentReference[] = [];

  const answers = await getDocs(answersCol(studentId, subject, level));

  for (const answerDoc of answers.docs) {
    const history = await getDocs(collection(answerDoc.ref, "attemptHistory"));
    history.forEach((historyDoc) => refs.push(historyDoc.ref));
    refs.push(answerDoc.ref);
  }

  const score = scoreRef(studentId, subject, level);
  const scoreHistory = await getDocs(collection(score, "attemptHistory"));
  scoreHistory.forEach((historyDoc) => refs.push(historyDoc.ref));
  refs.push(score);

  await deleteInChunks(refs);
}

// completed tests of a subject, newest first (for an activity page)
export async function fetchActivityData(studentId: string, subject: string) {
  const levels = await getAvailableLevelsWithCategories(subject);
  const activities: Record<string, unknown>[] = [];

  for (const { levelId } of levels) {
    try {
      const data = await fetchScoreData(studentId, subject, levelId);

      if (data && data.status === "Completed") {
        activities.push({
          date: data.latestAttemptEndTime ?? null,
          latestTotalSeconds: data.latestTotalSeconds ?? 0,
          categoryName: data.categoryName ?? data.level ?? levelId,
          level: data.level ?? levelId,
          score: data.score ?? 0,
          totalQuestions: data.totalNoQuestions ?? 0,
          badge: data.latestBadge ?? "",
          attemptNo: data.latestAttemptNo ?? 1,
          averageSeconds: data.latestAverageSeconds ?? 0,
        });
      }
    } catch (error) {
      console.error(`Error fetching level ${levelId}:`, error);
    }
  }

  activities.sort((a, b) => {
    const dateA = (a.date as Timestamp | null)?.toDate().getTime() ?? 0;
    const dateB = (b.date as Timestamp | null)?.toDate().getTime() ?? 0;
    return dateB - dateA;
  });

  return activities;
}