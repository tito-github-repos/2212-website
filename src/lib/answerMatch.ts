// src/lib/answerMatch.ts
// Turns spoken or typed answers into one simple form so they can be compared.
//
// Understands: 7, seven, twenty-one, one hundred twenty, two thousand five hundred,
// three million, 1,200, zero point five, minus three, one two three (digit by digit),
// one by two / one over two (fractions), "the answer is five".

const SMALL: Record<string, number> = {
  zero: 0, zeros: 0, zeroes: 0, oh: 0, o: 0, nil: 0, nought: 0, naught: 0,
  hero: 0, xero: 0, cero: 0, sero: 0, jero: 0, jiro: 0, ziro: 0, one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3,
  four: 4, for: 4, fore: 4, five: 5, six: 6, seven: 7, eight: 8, ate: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
  fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};

const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

const BIG_SCALES: Record<string, number> = {
  million: 1_000_000,
  billion: 1_000_000_000,
};

const NUMERIC = /^-?\d+(\.\d+)?$/;
const FRACTION = /^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/;

function wordsToNumber(input: string): string | null {
  const text = input
    .replace(/([a-z])-([a-z])/g, "$1 $2") // "twenty-one" -> "twenty one"
    .replace(
      /\b(the answer is|answer is|it is|it's|its|is equal to|equals|equal to|equal)\b/g,
      " "
    ); // "the answer is five" -> "five"

  // fractions: "one by two", "three over four"
  const parts = text.trim().split(/\s+(?:divided by|by|over)\s+/);

  if (parts.length === 2) {
    const top = wordsToNumber(parts[0]);
    const bottom = wordsToNumber(parts[1]);

    return top !== null && bottom !== null ? `${top}/${bottom}` : null;
  }

  const tokens = text
    .split(/\s+/)
    .filter((t) => t && t !== "and" && t !== "a");

  if (tokens.length === 0) return null;

  // digit by digit: "one two three" -> 123, "5 5" -> 55
  const isSingleDigit = (t: string) =>
    /^\d$/.test(t) || (t in SMALL && SMALL[t] <= 9);

  if (tokens.length >= 2 && tokens.every(isSingleDigit)) {
    return tokens.map((t) => (/^\d$/.test(t) ? t : String(SMALL[t]))).join("");
  }

  let grand = 0; // millions, billions
  let total = 0; // thousands
  let current = 0; // below one thousand
  let decimals = "";
  let afterPoint = false;
  let negative = false;

  for (const t of tokens) {
    if (t === "minus" || t === "negative") {
      negative = true;
    } else if (t === "point" || t === "dot") {
      afterPoint = true;
    } else if (t in SMALL) {
      if (afterPoint) decimals += SMALL[t];
      else current += SMALL[t];
    } else if (t in TENS) {
      current += TENS[t];
    } else if (t === "hundred") {
      current = (current || 1) * 100;
    } else if (t === "thousand") {
      total += (current || 1) * 1000;
      current = 0;
    } else if (t in BIG_SCALES) {
      grand += (total + current || 1) * BIG_SCALES[t];
      total = 0;
      current = 0;
    } else if (/^\d+$/.test(t)) {
      // digits mixed with words, e.g. "minus 3" or "0 point 5"
      if (afterPoint) decimals += t;
      else if (current === 0 && total === 0 && grand === 0) current = Number(t);
      else return null;
    } else {
      return null; // not a number phrase, keep it as normal text
    }
  }

  return `${negative ? "-" : ""}${grand + total + current}${
    decimals ? "." + decimals : ""
  }`;
}

export function normalizeAnswer(value: string): string {
  let text = value
    .toLowerCase()
    .trim()
    .replace(/−/g, "-") // special minus sign
    .replace(/,/g, "") // 1,200 -> 1200
    .replace(/[.!?]+$/, ""); // "5." -> "5"

  const fromWords = wordsToNumber(text); // "twelve" -> "12"
  if (fromWords !== null) {
    text = fromWords;
  }

  text = text.replace(/\s+/g, "");

  if (text.startsWith(".")) {
    text = "0" + text;
  }

  text = text.replace("²", "^2").replace("³", "^3");

  return text;
}

// "12" -> 12, "1/2" -> 0.5, anything else -> null
function toNumber(value: string): number | null {
  if (NUMERIC.test(value)) {
    return Number(value);
  }

  if (FRACTION.test(value)) {
    const [top, bottom] = value.split("/").map(Number);
    return bottom !== 0 ? top / bottom : null;
  }

  return null;
}

export function areAnswersEquivalent(
  userAnswer: string,
  correctAnswer: string
): boolean {
  const user = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);

  if (user === correct) {
    return true;
  }

  const userNumber = toNumber(user);
  const correctNumber = toNumber(correct);

  if (userNumber !== null && correctNumber !== null) {
    const userFixed = Math.trunc(userNumber * 10000) / 10000;
    const correctFixed = Math.trunc(correctNumber * 10000) / 10000;

    return userFixed === correctFixed;
  }

  return false;
}

/** What to show and save: "one" -> "1", "twelve" -> "12", anything else stays as heard. */
export function toDisplayAnswer(value: string): string {
  const normalized = normalizeAnswer(value);

  if (NUMERIC.test(normalized) || FRACTION.test(normalized)) {
    return normalized;
  }

  return value.trim();
}