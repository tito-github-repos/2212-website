// src/lib/answerInput.ts
// Filters what can be TYPED into the answer box of the MCE quiz.
//
// Allowed:   digits 0-9, decimal point ".", fraction slash "/", percent "%", minus "-",
//            power sign "^", superscript digits (⁰¹²³⁴⁵⁶⁷⁸⁹) and a space (for "1 1/2").
// Removed:   letters (a-z, any language), words, and every other symbol.
//
// Spoken answers are NOT filtered here. The voice code turns words into numbers first
// ("twenty five percent" -> "25.0%"), and that result only contains the allowed characters.

const NOT_ALLOWED = /[^0-9./%^\-⁰¹²³⁴⁵⁶⁷⁸⁹ ]/g;

export function sanitizeAnswerInput(value: string): string {
  return value
    .replace(/[−–—]/g, "-") // special minus signs become a normal minus
    .replace(NOT_ALLOWED, "") // drop everything that is not a number or math symbol
    .replace(/\s+/g, " ") // no double spaces
    .replace(/^\s+/, ""); // no space at the start
}