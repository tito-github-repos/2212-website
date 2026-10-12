// src/lib/questionCheck.ts
// Development helper: recalculates simple questions like "7+3 = ?" and warns in the
// browser Console when the answer stored in Firebase does not match the real result.

import { areAnswersEquivalent } from "./answerMatch";

type Q = { question: string; answer: string; category?: string };

// "7+3 = ?" -> 10, "6 x 4" -> 24, "9-8 = ?" -> 1, anything else -> null
export function calculateQuestion(question: string): number | null {
  const expr = question
    .replace(/[=?]/g, "")
    .replace(/[×xX]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\s+/g, "");

  // only digits and basic operators are allowed, so nothing else can ever run
  if (!/^[0-9+\-*/().]+$/.test(expr)) return null;

  try {
    const result = Function(`"use strict"; return (${expr});`)();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

export function checkQuestionBank(questions: Q[]) {
  let checked = 0;
  let wrong = 0;

  questions.forEach((q, i) => {
    const calculated = calculateQuestion(q.question);

    if (calculated === null) return; // not a simple sum, skip

    checked++;

    if (!areAnswersEquivalent(String(calculated), q.answer)) {
      wrong++;
      console.warn(
        `Question bank problem at Q${i + 1}: "${q.question}" is stored with answer "${q.answer}" but the real result is ${calculated}`
      );
    }
  });

  console.log(
    `Question bank check: ${checked} questions checked, ${wrong} with a wrong stored answer, ${
      questions.length - checked
    } skipped (not simple sums)`
  );
}