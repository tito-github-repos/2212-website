"use client";

// src/lib/useQuestionController.ts
// React version of the Flutter QuestionController (GetX). The page uses it the same way
// the mobile screens use the controller: load, nextQuestion, submitQuiz, discardAttempt.
//
// RULE: nothing from a running attempt is written to the database.
// Answers stay in memory and are saved only when the test is completed.
// Leaving the test just throws the attempt away, so the previous completed result is untouched.

import { useEffect, useRef, useState } from "react";

import { areAnswersEquivalent } from "./answerMatch";
import { checkQuestionBank } from "./questionCheck";
import { calculateBadge } from "./quizRules";
import {
  deleteAllAnswers,
  fetchQuestions,
  fetchSavedAnswers,
  fetchScoreData,
  getAvailableLevelsWithCategories,
  getNextAttemptNumber,
  getStudent,
  moveAnswersToAttemptHistory,
  moveScoreToAttemptHistory,
  saveAnswerDoc,
  updateScoreSheet,
  type LevelInfo,
  type QuestionItem,
  type ScoreData,
  type Student,
} from "./questionService";

export type SubmitResult = {
  score: number;
  total: number;
  badge: string;
  attemptNo: number;
  averageSeconds: number;
  totalSeconds: number; // the whole test, in seconds
  saved: boolean; // false for guests, or when saving failed
  nextLevel: LevelInfo | null;
  error?: string;
};

type KeptAnswer = {
  index: number;
  answer: string;
  isSubmit: boolean;
  seconds: number;
  startedAt: Date;
};

export function useQuestionController(subject: string, level: string) {
  /* ------------------------------ state (UI) ------------------------------ */

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalScore, setTotalScore] = useState(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [currentQuestionTime, setCurrentQuestionTime] = useState(0);
  const [previous, setPrevious] = useState<ScoreData | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [student, setStudent] = useState<Student>({ id: "", email: null, isGuest: true });

  /* ------------- refs (always the latest value, safe for voice) ------------ */

  const studentRef = useRef<Student>({ id: "", email: null, isGuest: true });
  const questionsRef = useRef<QuestionItem[]>([]);
  const answersRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  const questionStartRef = useRef<Date>(new Date()); // start of the current question
  const attemptStartRef = useRef<Date>(new Date()); // start of this attempt
  const elapsedRef = useRef(0);
  const questionTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const keptRef = useRef<KeptAnswer[]>([]); // answers of the running attempt (memory only)
  const submittingRef = useRef(false);

  // what is already in the database when the page opens
  const previousCompletedRef = useRef(false); // a completed result exists
  const leftoverAnswersRef = useRef(0); // answers left by an old unfinished attempt

  /* -------------------------------- timers --------------------------------- */

  function stopTimers() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startTimers() {
    stopTimers();

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      questionTimeRef.current += 1;

      setTotalElapsedSeconds(elapsedRef.current);
      setCurrentQuestionTime(questionTimeRef.current);
    }, 1000);
  }

  /* ------------------------------ load questions --------------------------- */

  // only reads data, nothing is changed in the database
  async function loadQuestions() {
    try {
      const currentStudent = await getStudent();
      studentRef.current = currentStudent;
      setStudent(currentStudent);

      const items = await fetchQuestions(subject, level);
      questionsRef.current = items;
      setQuestions(items);

      if (process.env.NODE_ENV === "development") {
        checkQuestionBank(items);
      }

      let score: ScoreData | null = null;
      let leftover = 0;

      if (!currentStudent.isGuest && currentStudent.id) {
        const saved = await fetchSavedAnswers(currentStudent.id, subject, level, items.length);
        leftover = saved.filter((answer) => answer !== "").length;
        score = await fetchScoreData(currentStudent.id, subject, level);
      }

      // a new attempt always starts empty from question 1
      answersRef.current = new Array(items.length).fill("");
      setUserAnswers([...answersRef.current]);

      indexRef.current = 0;
      setCurrentQuestionIndex(0);

      previousCompletedRef.current = score?.status === "Completed";
      leftoverAnswersRef.current = leftover;

      setPrevious(score);
      setSavedCount(leftover);

      setIsLoading(false);
    } catch (e) {
      console.error("Error loading questions:", e);
      setError(
        e instanceof Error && e.message === "Level not found"
          ? "Questions not found"
          : "Unable to load questions"
      );
      setIsLoading(false);
    }
  }

  // load when the subject or level changes (must stay BELOW loadQuestions)
  useEffect(() => {
    loadQuestions();

    return () => stopTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, level]);

  /* ------------------------------ start attempt ----------------------------- */

  // always a fresh start from question 1, nothing is written to the database
  function startAttempt() {
    const count = questionsRef.current.length;

    keptRef.current = [];
    submittingRef.current = false;

    answersRef.current = new Array(count).fill("");
    setUserAnswers([...answersRef.current]);

    indexRef.current = 0;
    setCurrentQuestionIndex(0);

    elapsedRef.current = 0;
    questionTimeRef.current = 0;
    setTotalElapsedSeconds(0);
    setCurrentQuestionTime(0);
    setTotalScore(0);

    attemptStartRef.current = new Date();
    questionStartRef.current = new Date();

    startTimers();
  }

  /* ----------------------------- small helpers ------------------------------ */

  function getCorrectAnswer() {
    return questionsRef.current[indexRef.current]?.answer ?? "";
  }

  function isLastQuestion() {
    return indexRef.current >= questionsRef.current.length - 1;
  }

  function storeAnswer(index: number, answer: string) {
    answersRef.current[index] = answer;
    setUserAnswers([...answersRef.current]);
  }

  // keeps the answer in memory only
  function keepAnswer(index: number, answer: string, isSubmit: boolean, seconds: number) {
    if (!questionsRef.current[index]) return;

    keptRef.current.push({
      index,
      answer,
      isSubmit,
      seconds,
      startedAt: questionStartRef.current,
    });
  }

  /* ---------------------------- next question ------------------------------- */

  function nextQuestion(answer: string) {
    const index = indexRef.current;

    storeAnswer(index, answer);
    keepAnswer(index, answer, false, questionTimeRef.current);

    if (index < questionsRef.current.length - 1) {
      indexRef.current = index + 1;
      setCurrentQuestionIndex(index + 1);

      questionStartRef.current = new Date();
      questionTimeRef.current = 0;
      setCurrentQuestionTime(0);
    }
  }

  /* ------------------------------ submit quiz ------------------------------- */

  // lastAnswer = "" means the time ran out and the current question was not answered
  async function submitQuiz(lastAnswer: string): Promise<SubmitResult> {
    const items = questionsRef.current;
    const total = items.length;
    const currentStudent = studentRef.current;

    if (submittingRef.current) {
      return {
        score: 0,
        total,
        badge: "",
        attemptNo: 0,
        averageSeconds: 0,
        totalSeconds: 0,
        saved: false,
        nextLevel: null,
      };
    }

    submittingRef.current = true;
    stopTimers();

    // the real time of the test, measured NOW (saving to Firebase is not counted)
    const totalSeconds = Math.floor((Date.now() - attemptStartRef.current.getTime()) / 1000);
    const averageSeconds = total > 0 ? Math.floor(totalSeconds / total) : 0;

    const index = indexRef.current;

    if (lastAnswer !== "") {
      storeAnswer(index, lastAnswer);
      keepAnswer(index, lastAnswer, true, questionTimeRef.current);
    }

    // score from the local answers (the same rule as the mobile app)
    let correct = 0;

    for (let i = 0; i < total; i++) {
      if (areAnswersEquivalent(answersRef.current[i] ?? "", items[i].answer)) {
        correct++;
      }
    }

    setTotalScore(correct);

    if (currentStudent.isGuest || !currentStudent.id) {
      return {
        score: correct,
        total,
        badge: "",
        attemptNo: 0,
        averageSeconds,
        totalSeconds,
        saved: false,
        nextLevel: null,
      };
    }

    try {
      // the test is completed, only now the database is changed
      if (previousCompletedRef.current) {
        // retry: the old completed result goes to history
        await moveScoreToAttemptHistory(currentStudent.id, subject, level);
        await moveAnswersToAttemptHistory(currentStudent.id, subject, level);
        await deleteAllAnswers(currentStudent.id, subject, level);
      } else if (leftoverAnswersRef.current > 0) {
        // answers left by an old unfinished attempt: clear them
        await deleteAllAnswers(currentStudent.id, subject, level);
      }

      await Promise.all(
        keptRef.current.map((kept) => {
          const question = items[kept.index];
          if (!question) return Promise.resolve();

          return saveAnswerDoc({
            studentId: currentStudent.id,
            subject,
            level,
            index: kept.index,
            question: question.question,
            correctAnswer: question.answer,
            answer: kept.answer,
            isSubmit: kept.isSubmit,
            secondsTaken: kept.seconds,
            startedAt: kept.startedAt,
          }).catch((e) => {
            console.error("Error saving answer:", e);
          });
        })
      );

      keptRef.current = [];
      previousCompletedRef.current = true;
      leftoverAnswersRef.current = 0;

      const badge = calculateBadge(correct, total, totalSeconds);

      const attemptNo = await getNextAttemptNumber(currentStudent.id, subject, level);

      await updateScoreSheet({
        studentId: currentStudent.id,
        subject,
        level,
        score: correct,
        badge,
        totalSeconds,
        attemptNo,
        totalQuestions: total,
        categoryName: items[0]?.category || level,
        startedAt: attemptStartRef.current,
      });

      const allLevels = await getAvailableLevelsWithCategories(subject);
      const position = allLevels.findIndex((item) => item.levelId === level);
      const nextLevel =
        position >= 0 && position < allLevels.length - 1 ? allLevels[position + 1] : null;

      return {
        score: correct,
        total,
        badge,
        attemptNo,
        averageSeconds,
        totalSeconds,
        saved: true,
        nextLevel,
      };
    } catch (e) {
      console.error("Error submitting quiz:", e);

      return {
        score: correct,
        total,
        badge: "",
        attemptNo: 0,
        averageSeconds,
        totalSeconds,
        saved: false,
        nextLevel: null,
        error: "Your score could not be saved. Please check your internet.",
      };
    }
  }

  /* ----------------------------- discard attempt ---------------------------- */

  // leave the test: the running attempt is thrown away, the database is not touched
  function discardAttempt() {
    stopTimers();
    keptRef.current = [];
  }

  return {
    // state
    questions,
    userAnswers,
    currentQuestionIndex,
    isLoading,
    error,
    totalScore,
    totalElapsedSeconds,
    currentQuestionTime,
    previous,
    savedCount,
    student,
    // actions
    startAttempt,
    nextQuestion,
    submitQuiz,
    discardAttempt,
    // synchronous helpers for the voice hook
    getCorrectAnswer,
    isLastQuestion,
  };
}