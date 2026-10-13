"use client";

// src/lib/useQuestionController.ts
// React version of the Flutter QuestionController (GetX). The page uses it the same way
// the mobile screens use the controller: load, nextQuestion, submitQuiz, saveAndClose.

import { useEffect, useRef, useState } from "react";

import { areAnswersEquivalent } from "./answerMatch";
import { checkQuestionBank } from "./questionCheck";
import { calculateBadge } from "./quizRules";
import {
  deleteAllAnswers,
  fetchQuestions,
  fetchSavedAnswers,
  fetchScoreData,
  firstUnansweredIndex,
  getAvailableLevelsWithCategories,
  getNextAttemptNumber,
  getStudent,
  moveAnswersToAttemptHistory,
  moveScoreToAttemptHistory,
  saveAnswerDoc,
  saveInProgress,
  sumSecondsTaken,
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
  const attemptStartRef = useRef<Date>(new Date()); // start of this sitting
  const previousSecondsRef = useRef(0); // seconds saved by an earlier sitting (continue)
  const elapsedRef = useRef(0);
  const questionTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pendingRef = useRef<Promise<unknown>[]>([]);
  const submittingRef = useRef(false);

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

  useEffect(() => {
    loadQuestions();

    return () => stopTimers();
  }, [subject, level]);

  /* ------------------------------ load questions --------------------------- */

  // only reads data, nothing is changed until startAttempt() is called
  async function loadQuestions() {
    try {
      setIsLoading(true);
      setError("");

      const currentStudent = await getStudent();
      studentRef.current = currentStudent;
      setStudent(currentStudent);

      const items = await fetchQuestions(subject, level);
      questionsRef.current = items;
      setQuestions(items);

      if (process.env.NODE_ENV === "development") {
        checkQuestionBank(items);
      }

      let answers: string[] = new Array(items.length).fill("");
      let index = 0;
      let score: ScoreData | null = null;

      if (!currentStudent.isGuest && currentStudent.id) {
        answers = await fetchSavedAnswers(currentStudent.id, subject, level, items.length);
        index = firstUnansweredIndex(answers);
        score = await fetchScoreData(currentStudent.id, subject, level);
      }

      answersRef.current = answers;
      setUserAnswers([...answers]);

      indexRef.current = index;
      setCurrentQuestionIndex(index);

      setPrevious(score);
      setSavedCount(answers.filter((answer) => answer !== "").length);

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

  /* ------------------------------ start attempt ----------------------------- */

  // retry = true: the old attempt goes to attemptHistory and every answer is cleared
  // retry = false: continue from the first unanswered question
  async function startAttempt(retry: boolean) {
    const currentStudent = studentRef.current;
    const count = questionsRef.current.length;

    previousSecondsRef.current = 0;

    if (retry) {
      if (!currentStudent.isGuest && currentStudent.id) {
        await moveScoreToAttemptHistory(currentStudent.id, subject, level);
        await moveAnswersToAttemptHistory(currentStudent.id, subject, level);
        await deleteAllAnswers(currentStudent.id, subject, level);
      }

      answersRef.current = new Array(count).fill("");
      setUserAnswers([...answersRef.current]);

      indexRef.current = 0;
      setCurrentQuestionIndex(0);

      setSavedCount(0);
      console.log("Retry: previous attempt moved to history and answers cleared");
    } else if (!currentStudent.isGuest && currentStudent.id) {
      // continuing a half-finished test: keep the seconds already used
      try {
        previousSecondsRef.current = await sumSecondsTaken(currentStudent.id, subject, level);
      } catch (e) {
        console.error("Could not read the earlier seconds:", e);
      }
    }

    pendingRef.current = [];
    submittingRef.current = false;

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

  function saveInBackground(index: number, answer: string, isSubmit: boolean, seconds: number) {
    const currentStudent = studentRef.current;

    if (currentStudent.isGuest || !currentStudent.id) return; // guests are never saved

    const item = questionsRef.current[index];
    if (!item) return;

    const saving = saveAnswerDoc({
      studentId: currentStudent.id,
      subject,
      level,
      index,
      question: item.question,
      correctAnswer: item.answer,
      answer,
      isSubmit,
      secondsTaken: seconds,
      startedAt: questionStartRef.current,
    }).catch((e) => {
      console.error("Error saving answer:", e);
    });

    pendingRef.current.push(saving);
  }

  /* ---------------------------- next question ------------------------------- */

  // shows the next question straight away, saving happens in the background
  function nextQuestion(answer: string) {
    const index = indexRef.current;

    storeAnswer(index, answer);
    saveInBackground(index, answer, false, questionTimeRef.current);

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
    const sessionSeconds = Math.floor((Date.now() - attemptStartRef.current.getTime()) / 1000);
    const totalSeconds = previousSecondsRef.current + sessionSeconds;
    const averageSeconds = total > 0 ? Math.floor(totalSeconds / total) : 0;

    const index = indexRef.current;

    if (lastAnswer !== "") {
      storeAnswer(index, lastAnswer);
      saveInBackground(index, lastAnswer, true, questionTimeRef.current);
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
      await Promise.all(pendingRef.current);

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

  /* ----------------------------- save and close ----------------------------- */

  // leave the test half way: answers stay saved and the level is marked InProgress
  async function saveAndClose(currentAnswer: string) {
    stopTimers();

    const currentStudent = studentRef.current;

    if (currentStudent.isGuest || !currentStudent.id) return; // guests: just leave

    try {
      const index = indexRef.current;

      if (currentAnswer !== "") {
        const seconds = Math.floor((Date.now() - questionStartRef.current.getTime()) / 1000);

        storeAnswer(index, currentAnswer);
        saveInBackground(index, currentAnswer, false, seconds);
      }

      await Promise.all(pendingRef.current);

      await saveInProgress(
        currentStudent.id,
        subject,
        level,
        questionsRef.current[0]?.category || level
      );

      console.log("Saved InProgress state");
    } catch (e) {
      console.error("Error in saveAndClose:", e);
    }
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
    saveAndClose,
    // synchronous helpers for the voice hook
    getCorrectAnswer,
    isLastQuestion,
  };
}