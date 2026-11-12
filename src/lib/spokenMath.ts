/*
  Turns what a student SAYS into a number, and decides what to hand to the quiz.

  Covers every sheet MCE-1 .. MCE-16:
  integers ("forty two", "42", "one hundred and five", "fifty nine thousand forty nine", "one seven two eight"),
  decimals ("zero point eight five seven one four two", "point zero five"),
  negatives ("minus three"),
  fractions ("six by seven", "six over seven", "six sevenths", "one by two hundred", "half", "one and a half"),
  powers ("seven to the power of five", "two power ten", "seven raised to five", "seven to the fifth power",
          "two squared", "three cubed"),
  percent ("eighty five point seven one percent", "percentage", "per cent").

  Sheet answers that are rounded or cut short ("2/3 = 0.666", "5/12 = 0.4166", "5/12 = 41.66% or 41.67%")
  are accepted whether the student says the cut or the rounded version.
*/

const UNITS: Record<string, number> = {
  zero: 0, oh: 0, o: 0, nil: 0, nought: 0, naught: 0, hero: 0, xero: 0, cero: 0, sero: 0, jero: 0, jiro: 0, ziro: 0,
  one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3, four: 4, for: 4, fore: 4,
  five: 5, six: 6, seven: 7, eight: 8, ate: 8, nine: 9,
};
const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20, thirty: 30, forty: 40, fourty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULTS: Record<string, number> = {
  hundred: 100, thousand: 1e3, lakh: 1e5, lakhs: 1e5, lac: 1e5, million: 1e6, crore: 1e7, crores: 1e7, billion: 1e9,
};
const DENOMS: Record<string, number> = {
  half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4, fourth: 4, fourths: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8,
  ninth: 9, ninths: 9, tenth: 10, tenths: 10, eleventh: 11, elevenths: 11, twelfth: 12, twelfths: 12,
  thirteenth: 13, thirteenths: 13, fourteenth: 14, fourteenths: 14, fifteenth: 15, fifteenths: 15,
  sixteenth: 16, sixteenths: 16, seventeenth: 17, seventeenths: 17, eighteenth: 18, eighteenths: 18,
  nineteenth: 19, nineteenths: 19, twentieth: 20, twentieths: 20, thirtieth: 30, thirtieths: 30,
  fortieth: 40, fortieths: 40, fiftieth: 50, fiftieths: 50,
  hundredth: 100, hundredths: 100, thousandth: 1000, thousandths: 1000,
};
// "seven to the fifth (power)" -> exponent 5
const ORDINAL_EXP: Record<string, number> = {
  second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
};
const SKIP = new Set(["a", "an", "the", "is", "it", "its", "it's", "answer", "um", "umm", "uh", "uhh", "so", "well", "okay", "ok", "please"]);

type Read = { v: number; next: number };

const isDigits = (w: string) => /^\d+(\.\d+)?$/.test(w);
const isNumTok = (w: string | undefined): w is string =>
  !!w && (isDigits(w) || w in UNITS || w in TEENS || w in TENS || w in MULTS);
const isSingleDigit = (w: string) => w in UNITS || /^\d$/.test(w);
const digitOf = (w: string) => (w in UNITS ? UNITS[w] : Number(w));

/* a whole number made of words or digits: "one hundred and five" -> 105, "five five" -> 55 */
function readInt(t: string[], i: number): Read | null {
  const run: string[] = [];
  let j = i;

  while (j < t.length) {
    const w = t[j];
    const afterMultiplier = run.length > 0 && run[run.length - 1] in MULTS;

    if (isNumTok(w)) {
      run.push(w);
      j++;
    } else if (w === "and" && afterMultiplier && isNumTok(t[j + 1])) {
      j++; // "hundred AND five"
    } else break;
  }

  if (!run.length) return null;

  // "one two three" said digit by digit
  if (run.length >= 2 && run.every(isSingleDigit)) {
    return { v: Number(run.map(digitOf).join("")), next: j };
  }

  let total = 0;
  let cur = 0;

  for (const w of run) {
    if (isDigits(w)) cur += Number(w);
    else if (w in UNITS) cur += UNITS[w];
    else if (w in TEENS) cur += TEENS[w];
    else if (w in TENS) cur += TENS[w];
    else if (w === "hundred") cur = (cur || 1) * 100;
    else {
      total += (cur || 1) * MULTS[w];
      cur = 0;
    }
  }

  return { v: total + cur, next: j };
}

/* the digits after "point": "five" -> .5, "zero five" -> .05, "twenty five" -> .25 */
function readDecimalDigits(t: string[], i: number): Read | null {
  let j = i;
  while (isNumTok(t[j]) && !(t[j] in MULTS)) j++;
  if (j === i) return null;

  const part = t.slice(i, j);
  const digits = part.every(isSingleDigit) ? part.map(digitOf).join("") : String(readInt(part, 0)?.v ?? "");
  if (!digits) return null;

  return { v: Number("0." + digits), next: j };
}

/* integer or decimal: "forty two", "two point five", "point zero five" */
function readNumber(t: string[], i: number): Read | null {
  const whole = readInt(t, i);

  if (!whole) {
    if (t[i] !== ".") return null;
    return readDecimalDigits(t, i + 1);
  }

  if (t[whole.next] === ".") {
    const dec = readDecimalDigits(t, whole.next + 1);
    if (!dec) return null; // "two point" -> not finished yet
    return { v: whole.v + dec.v, next: dec.next };
  }

  return whole;
}

/* "three by four", "three fourths", "a half" */
function readFraction(t: string[], i: number): Read | null {
  let k = i;
  if (t[k] === "a" || t[k] === "an") k++;

  const n = readNumber(t, k);

  if (n) {
    if (t[n.next] === "/") {
      const d = readNumber(t, n.next + 1);
      return d ? { v: n.v / d.v, next: d.next } : null;
    }
    if (t[n.next] in DENOMS) return { v: n.v / DENOMS[t[n.next]], next: n.next + 1 };
    return null;
  }

  if (t[k] in DENOMS) return { v: 1 / DENOMS[t[k]], next: k + 1 };
  return null;
}

function readSigned(t: string[], i: number): Read | null {
  if (t[i] === "-") {
    const r = readNumber(t, i + 1);
    return r ? { v: -r.v, next: r.next } : null;
  }
  return readNumber(t, i);
}

function readValue(t: string[], i: number): Read | null {
  const n = readNumber(t, i);
  let v: number;
  let j: number;

  if (n) {
    v = n.v;
    j = n.next;

    if (t[j] === "/") {
      const d = readNumber(t, j + 1);
      if (!d) return null; // "three over" -> not finished yet
      v = v / d.v;
      j = d.next;
    } else if (t[j] in DENOMS) {
      v = v / DENOMS[t[j]];
      j++;
    }

    // "one and a half", "two and three fourths"
    if (t[j] === "and") {
      const f = readFraction(t, j + 1);
      if (f) {
        v += f.v;
        j = f.next;
      }
    }
  } else {
    const f = readFraction(t, i);
    if (!f) return null;
    v = f.v;
    j = f.next;
  }

  // "two squared", "two to the power of five"
  if (t[j] === "^") {
    const e = readSigned(t, j + 1);
    if (!e) return null; // "two to the power of" -> not finished yet
    v = Math.pow(v, e.v);
    j = e.next;
  }

  return { v, next: j };
}

// "six ty" / "six teen" (a pause inside the word) -> "sixty" / "sixteen"
const STEM: Record<string, string> = { three: "thir", five: "fif", eight: "eigh" };

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(
      /\b(three|thir|four|five|fif|six|seven|eight|eigh|nine)\s+(ty|teen)\b/g,
      (_m: string, a: string, b: string) => (STEM[a] ?? a) + b
    )
    .replace(/[−–—]/g, "-")
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/[,!?;:]/g, " ")
    .replace(/\.(\s|$)/g, " ")
    .replace(/(?<=[a-z])-(?=[a-z])/g, " ") // forty-two
    .replace(/\bequals?( to)?\b|\bp[ae]r ?[cs]ent(?:age)?\b|%/g, " ")
    // "seven to the fifth power", "two raised to the third"
    .replace(
      /\b(?:raised )?to the (second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)(?: power)?\b/g,
      (_m: string, w: string) => ` ^ ${ORDINAL_EXP[w]} `
    )
    .replace(
      /\b(?:raised to the power of|raised to the power|to the power of|to the power|raised to the|raised to|to the|power of|power|pow|exponent)\b/g,
      " ^ "
    )
    .replace(/\b(?:squared|square)\b/g, " ^ 2 ")
    .replace(/\b(?:cubed|cube)\b/g, " ^ 3 ")
    .replace(/\b(?:divided by|over|upon|slash|by|buy|bye|bi)\b/g, " / ")
    .replace(/\b(?:point|dot)\b/g, " . ")
    .replace(/\b(?:minus|negative)\b/g, " - ");
}

/* What number was said? Returns null if it is not a finished number. */
export function parseSpoken(input: string): number | null {
  const t = normalize(input).match(/[a-z']+|\d+(?:\.\d+)?|[\/^.\-]/g) ?? [];

  let i = 0;
  while (i < t.length && SKIP.has(t[i])) i++;

  let sign = 1;
  if (t[i] === "-") {
    sign = -1;
    i++;
  }

  const r = readValue(t, i);
  if (!r) return null;

  const v = sign * r.v;
  return Number.isFinite(v) ? v : null;
}

const SUP_DIGITS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/* The expected answer in the question bank: "42", "0.75", "3/4", "1 1/2", "2^3", "7⁵", "3¹⁰", "9²", "25%". */
export function parseExpected(raw: string): number | null {
  const s = raw.trim().replace(/[−–—]/g, "-").replace(/(\d),(?=\d{3}\b)/g, "$1").replace(/\s+/g, " ").replace(/%$/, "").trim();

  // any superscript exponent, one or more digits: 7⁵, 3¹⁰, 2¹
  const sup = s.match(/^(-?\d+(?:\.\d+)?)\s*([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/);
  if (sup) {
    const exp = Number([...sup[2]].map((c) => SUP_DIGITS.indexOf(c)).join(""));
    return Math.pow(Number(sup[1]), exp);
  }

  const pow = s.match(/^(-?\d+(?:\.\d+)?)\s*(?:\^|\*\*)\s*(-?\d+(?:\.\d+)?)$/);
  if (pow) return Math.pow(Number(pow[1]), Number(pow[2]));

  const mixed = s.match(/^(-?)(\d+) (\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const v = Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]);
    return mixed[1] ? -v : v;
  }

  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);

  const lead = s.match(/^-?\d+(?:\.\d+)?(?=\s|[a-zA-Z]|$)/);
  return lead ? Number(lead[0]) : null;
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

const formatNumber = (v: number) => (Number.isInteger(v) ? String(v) : String(Number(v.toFixed(6))));

/*
  Sheet answers like 0.666 (2/3), 0.4166 (5/12), 41.66% (5/12), 0.33 (1/3) are cut short or rounded.
  Work out the real value behind such an answer, then accept what the student says if it is
  the cut version, the rounded version, or the same with more digits.
  Plain terminating answers (0.5, 0.125, 0.05, 12.5%) must still match exactly.
*/
const TERMINATING = [1, 2, 4, 5, 8, 10, 16, 20, 25, 32, 40, 50, 64, 80]; // 0.5, 0.125, 0.0625, 0.0125 ...
const UNIT_ONLY = [100, 200, 1000]; // 1/100, 1/200, 1/1000 only (so 0.33 is NOT treated as 33/100)
const REPEATING = [3, 6, 7, 9, 11, 12, 24, 32, 48, 60, 70, 90];

function sameValue(spoken: number, raw: unknown, e: number): boolean {
  if (close(spoken, e)) return true;

  const text = String(raw).trim();
  const scale = text.endsWith("%") ? 100 : 1;
  const body = text.replace(/%$/, "").trim();
  if (!/^-?\d+\.\d+$/.test(body)) return false;

  const d = body.split(".")[1].length;
  const u = Math.pow(10, -d);
  const x = e / scale;

  for (const q of TERMINATING) if (Math.abs(x * q - Math.round(x * q)) < 1e-9) return false;
  for (const q of UNIT_ONLY) if (Math.abs(x * q - 1) < 1e-9) return false;

  for (const q of REPEATING) {
    const p0 = Math.round(x * q);
    for (const p of [p0 - 1, p0, p0 + 1]) {
      if (p <= 0) continue;
      const tv = (p / q) * scale; // the real value behind the cut-short answer
      if (tv < e - u / 2 - 1e-9 || tv >= e + u - 1e-9) continue;

      const f = Math.pow(10, d);
      const cut = Math.floor(tv * f + 1e-9) / f;
      const rounded = Math.round(tv * f) / f;

      return close(spoken, cut) || close(spoken, rounded) || Math.abs(spoken - tv) < 0.1 / f;
    }
  }

  return false;
}

/*
  What to hand to the quiz for something the student said.
  - Not a finished number -> null (the quiz is not given anything).
  - Same value as the right answer (0.75 vs 3/4, 8 vs 2^3, 0.667 vs 0.666) -> the right answer written
    exactly as the question bank has it, so it always matches whatever format the bank uses.
  - Otherwise -> the plain number that was said ("42", "2.5").
*/
export function resolveAnswer(spokenText: string, expected?: unknown): string | null {
  const spoken = parseSpoken(spokenText);
  if (spoken === null) return null;

  if (typeof expected === "string" || typeof expected === "number") {
    const e = parseExpected(String(expected));
    if (e !== null && sameValue(spoken, expected, e)) return String(expected);
  }

  // a wrong fraction stays a fraction ("one by fifty" -> "1/50", not "0.02"), so you can see what was heard
  const fraction = spokenAsFraction(spokenText);
  if (fraction) return fraction;

  // a percentage question, or the student said "percent": keep the % ("twenty percent" -> "20%")
  const percentQuestion = typeof expected === "string" && expected.trim().endsWith("%");
  const saidPercent = /per ?cent|persent|%/i.test(spokenText);
  if (percentQuestion || saidPercent) return formatNumber(spoken) + "%";

  return formatNumber(spoken);
}

/* "one by fifty" -> "1/50"; null if what was said is not a plain whole-number fraction */
function spokenAsFraction(input: string): string | null {
  const t = normalize(input).match(/[a-z']+|\d+(?:\.\d+)?|[\/^.\-]/g) ?? [];

  let i = 0;
  while (i < t.length && SKIP.has(t[i])) i++;

  const top = readInt(t, i);
  if (!top || t[top.next] !== "/") return null;

  const bottom = readInt(t, top.next + 1);
  if (!bottom || bottom.next !== t.length || bottom.v === 0) return null;

  return `${top.v}/${bottom.v}`;
}

/* True if what was said has the same value as the right answer ("three fourths" vs 3/4). */
export function matchesExpected(spokenText: string, expected?: unknown): boolean {
  if (typeof expected !== "string" && typeof expected !== "number") return false;

  const spoken = parseSpoken(spokenText);
  const e = parseExpected(String(expected));

  return spoken !== null && e !== null && sameValue(spoken, expected, e);
}