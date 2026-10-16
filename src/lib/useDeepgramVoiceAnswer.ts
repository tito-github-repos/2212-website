"use client";

/*
  Drop-in replacement for useVoiceAnswer that listens through Deepgram.
  Same inputs and outputs, plus `timings` and `stats` so you can see how fast it is.

  FAST HAND-IN: the quiz does not wait for Deepgram's own "end of answer" signal.
  The moment the words that were heard are a finished number AND you are not still speaking,
  it is handed to the quiz.
    - Matches the right answer ("forty two" for 42): handed in after a very short check (fast).
    - A short number that may still grow ("six" -> "sixty" / "sixteen") and is not the right answer:
      a longer check, so a pause inside the word does not cut it.
    - Anything else (wrong answers): a slightly longer check so a half-said number is not cut off (safe).
  Deepgram's own signal is still used as a back-up.

  After an answer is handed in, speech in the next fraction of a second is ignored
  (repeated answers, late words), and the mic box is emptied at once.

  Settings (all optional, put them in .env):
    NEXT_PUBLIC_DEEPGRAM_MODEL             default nova-3
    NEXT_PUBLIC_DEEPGRAM_LANGUAGE          default en   (try en-IN)
    NEXT_PUBLIC_DEEPGRAM_ENDPOINTING_MS    default 150  (Deepgram's own silence wait, back-up only)
    NEXT_PUBLIC_DEEPGRAM_EARLY_COMMIT      default true (false = only use Deepgram's signal)
    NEXT_PUBLIC_DEEPGRAM_FAST_SILENCE_MS   default 120  (quiet time needed, answer matches)
    NEXT_PUBLIC_DEEPGRAM_FAST_STABLE_MS    default 60   (words unchanged this long, answer matches)
    NEXT_PUBLIC_DEEPGRAM_SAFE_SILENCE_MS   default 200  (quiet time needed, everything else)
    NEXT_PUBLIC_DEEPGRAM_SAFE_STABLE_MS    default 150  (words unchanged this long, everything else)
    NEXT_PUBLIC_DEEPGRAM_GROW_SILENCE_MS   default 450  (quiet time needed, number may still grow: six -> sixty)
    NEXT_PUBLIC_DEEPGRAM_GROW_STABLE_MS    default 300  (words unchanged this long, number may still grow)
    NEXT_PUBLIC_DEEPGRAM_NEXT_GUARD_MS     default 250  (after a hand-in, speech in this time is ignored)
    NEXT_PUBLIC_DEEPGRAM_SMART_FORMAT      default false
    NEXT_PUBLIC_DEEPGRAM_KEYTERMS          default none (comma list, nova-3 only)
*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { matchesExpected, resolveAnswer } from "./spokenMath";

const MODEL = process.env.NEXT_PUBLIC_DEEPGRAM_MODEL || "nova-3";
const LANGUAGE = process.env.NEXT_PUBLIC_DEEPGRAM_LANGUAGE || "en";
const ENDPOINTING_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_ENDPOINTING_MS || 150);
const EARLY_COMMIT = process.env.NEXT_PUBLIC_DEEPGRAM_EARLY_COMMIT !== "false";
const FAST_SILENCE_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_FAST_SILENCE_MS || 120);
const FAST_STABLE_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_FAST_STABLE_MS || 60);
const SAFE_SILENCE_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_SAFE_SILENCE_MS || 200);
const SAFE_STABLE_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_SAFE_STABLE_MS || 150);
const GROW_SILENCE_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_GROW_SILENCE_MS || 450);
const GROW_STABLE_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_GROW_STABLE_MS || 300);
const NEXT_GUARD_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_NEXT_GUARD_MS || 250);
const SHOW_ANSWER_MS = Number(process.env.NEXT_PUBLIC_DEEPGRAM_SHOW_ANSWER_MS || 350); // how long the answer stays visible
const SAMPLE_RATE = 16000; // must match sample_rate sent to Deepgram below
// a number that ends like this may still be continued ("twenty" -> "twenty two"), so use the safe wait
const OPEN_ENDING = /(twenty|thirty|forty|fourty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|lakh|lac|crore|million|billion)$/;
const SMART_FORMAT = process.env.NEXT_PUBLIC_DEEPGRAM_SMART_FORMAT === "true";
const KEYTERMS = (process.env.NEXT_PUBLIC_DEEPGRAM_KEYTERMS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// a short number word that can still grow into a teen or a tens number: "six" -> "sixteen" / "sixty"
const GROWS = new Set(["three", "four", "five", "six", "seven", "eight", "nine", "3", "4", "5", "6", "7", "8", "9"]);
// words that can come right before such a number: "one hundred six" -> "one hundred sixty"
const BEFORE_GROWS = new Set(["and", "hundred", "thousand", "lakh", "lac", "crore", "million", "billion", "minus", "negative"]);

function mayGrow(text: string) {
  const w = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/);
  const last = w[w.length - 1];
  if (!GROWS.has(last)) return false;
  return w.length === 1 || BEFORE_GROWS.has(w[w.length - 2]);
}

export type VoiceTiming = {
  at: number;
  heard: string; // the words that were heard
  answer: string; // what was handed to the quiz ("" if it was not a number)
  expected?: string; // the right answer, for your own checking
  firstTextMs: number | null; // you start speaking -> first words appear
  finalMs: number | null; // you stop speaking -> answer handed to the quiz
  how: "fast" | "safe" | "final"; // fast/safe = our own hand-in, final = Deepgram's end signal
};

type Options = {
  onAnswer: (text: string) => void;
  getCorrectAnswer?: () => unknown;
  canListen?: () => boolean;
};

type DgWord = { word: string; punctuated_word?: string; start: number; end: number };

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
};

export function useDeepgramVoiceAnswer(options: Options) {
  const [listening, setListening] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [micMessage, setMicMessage] = useState("");
  const [micReady, setMicReady] = useState(false);
  const [timings, setTimings] = useState<VoiceTiming[]>([]);
  const [connectMs, setConnectMs] = useState<number | null>(null);

  // always call the newest callbacks from the page
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const wsRef = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const pendingRef = useRef<ArrayBuffer[]>([]); // audio recorded while the connection opens
  const audioSecRef = useRef(0); // seconds of audio sent to Deepgram so far = Deepgram's clock
  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null); // empties the box after the answer was shown

  const wordsRef = useRef<{ finals: DgWord[]; interim: DgWord[] }>({ finals: [], interim: [] });
  const textRef = useRef({ text: "", changedAt: 0 });
  // Deepgram's clock (seconds): words that START before this belong to an answer that is already gone
  const cutoffRef = useRef(0);
  const uttRef = useRef({ sStart: 0, sEnd: 0, firstAt: 0 });
  const vadRef = useRef({ speaking: false, run: 0, last: 0, noise: 0.01 });

  // numbers are shown as digits ("two" -> 2); text that is not a number is not shown at all
  const toDisplay = useCallback((text: string) => {
    const expected = optionsRef.current.getCorrectAnswer?.();
    return resolveAnswer(text, expected) ?? "";
  }, []);

  const resetAnswerState = useCallback(() => {
    wordsRef.current = { finals: [], interim: [] };
    textRef.current = { text: "", changedAt: 0 };
    uttRef.current = { sStart: 0, sEnd: 0, firstAt: 0 };
  }, []);

  const teardown = useCallback(() => {
    startingRef.current = false;

    const ws = wsRef.current;
    wsRef.current = null;

    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "CloseStream" }));
        ws.close();
      } catch {
        /* already closed */
      }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;

    pendingRef.current = [];
    audioSecRef.current = 0; // a new connection starts Deepgram's clock at 0 again
    cutoffRef.current = 0;
    resetAnswerState();
    vadRef.current = { speaking: false, run: 0, last: 0, noise: 0.01 };
  }, [resetAnswerState]);

  const stopListening = useCallback(() => {
    teardown();
    setListening(false);
    setMicReady(false);
  }, [teardown]);

  const clearHeard = useCallback(() => setHeardText(""), []);

  /* the answer is complete: measure it, then hand it to the quiz */
  const commit = useCallback(
    (now: number, how: "fast" | "safe" | "final") => {
      const heard = textRef.current.text;
      const utt = uttRef.current;
      const opts = optionsRef.current;

      const expected = opts.getCorrectAnswer?.();
      const answer = heard ? resolveAnswer(heard, expected) : null;

      // Deepgram's clock: ignore every word that starts before this.
      //  - the words just used (late or revised copies of the same words)
      //  - after a real answer, also the next fraction of a second (a repeated answer, an echo),
      //    because nobody can read a new question and answer it that fast
      const { finals, interim } = wordsRef.current;
      const lastEnd = [...finals, ...interim].reduce((max, w) => Math.max(max, w.end ?? 0), 0);
      const guard = answer !== null ? audioSecRef.current + NEXT_GUARD_MS / 1000 : 0;
      cutoffRef.current = Math.max(cutoffRef.current, lastEnd, guard);

      resetAnswerState();

      if (flashRef.current) clearTimeout(flashRef.current);

      if (!heard) {
        setHeardText("");
        return;
      }

      const timing: VoiceTiming = {
        at: Date.now(),
        heard,
        answer: answer ?? "",
        expected: typeof expected === "string" || typeof expected === "number" ? String(expected) : undefined,
        firstTextMs: utt.firstAt && utt.sStart ? Math.max(0, Math.round(utt.firstAt - utt.sStart)) : null,
        finalMs: utt.sEnd && now >= utt.sEnd ? Math.round(now - utt.sEnd) : null,
        how,
      };

      console.info(
        `[deepgram] heard "${heard}" -> ${timing.answer || "not a number"} | first text ${timing.firstTextMs ?? "-"} ms | handed in ${timing.finalMs ?? "-"} ms after you stopped (${how})`
      );

      setTimings((old) => [...old.slice(-99), timing]);

            // noise, "yes", "what?" and so on do not count as an answer
      if (answer === null || (opts.canListen && !opts.canListen())) {
        setHeardText("");
        return;
      }

      // the answer shows and the next question appears in the same screen update
      setHeardText(answer);
      opts.onAnswer(answer);

      // then the box empties by itself, ready for the next answer
      flashRef.current = setTimeout(() => setHeardText(""), SHOW_ANSWER_MS);
    },
    [resetAnswerState]
  );

  const refreshText = useCallback(
    (now: number) => {
      const { finals, interim } = wordsRef.current;
      const text = [...finals, ...interim]
        .map((w) => w.punctuated_word ?? w.word)
        .join(" ")
        .trim();

      if (text === textRef.current.text) return;

      textRef.current = { text, changedAt: now };

       if (text) {
        if (!uttRef.current.firstAt) uttRef.current.firstAt = now;
      }

      const shown = toDisplay(text);
      if (shown && flashRef.current) clearTimeout(flashRef.current);
      setHeardText(shown);
    },
    [toDisplay]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const now = performance.now();
      let data;

      try {
        data = JSON.parse(event.data as string);
      } catch {
        return;
      }

      if (data.type === "UtteranceEnd") {
        if (textRef.current.text) commit(now, "final");
        return;
      }

      if (data.type !== "Results") return;

      const alt = data.channel?.alternatives?.[0];
      const cutoff = cutoffRef.current;

      // keep only the words that start after the last answer that was handed in
      let words: DgWord[] = ((alt?.words ?? []) as DgWord[]).filter((w) => w.start >= cutoff);

      if (!alt?.words?.length && alt?.transcript) {
        const start = data.start ?? 0;
        const end = start + (data.duration ?? 0);
        if (start >= cutoff) words = [{ word: String(alt.transcript).trim(), start, end }];
      }

      if (data.is_final) {
        wordsRef.current.finals.push(...words);
        wordsRef.current.interim = [];
      } else {
        wordsRef.current.interim = words;
      }

      refreshText(now);

      if (data.speech_final && textRef.current.text) {
        // "six ... ty": Deepgram's early end signal must not cut a number that may still grow
        const text = textRef.current.text;
        const expected = optionsRef.current.getCorrectAnswer?.();
        const growing = mayGrow(text) && !matchesExpected(text, expected);

        if (!growing) commit(now, "final");
      }
    },
    [commit, refreshText]
  );

  /* fast hand-in: a finished number, and you are not still speaking */
  const maybeCommitEarly = useCallback(
    (now: number) => {
      if (!EARLY_COMMIT) return;

      const { text, changedAt } = textRef.current;
      if (!text) return;

      const expected = optionsRef.current.getCorrectAnswer?.();
      if (resolveAnswer(text, expected) === null) return; // not a finished number yet

      const matches = matchesExpected(text, expected);
      const open = OPEN_ENDING.test(text.toLowerCase().trim());
      const growing = !matches && mayGrow(text); // "six" while the answer is 60 or 16

      const fast = matches && !open;
      const silence = fast ? FAST_SILENCE_MS : growing ? GROW_SILENCE_MS : SAFE_SILENCE_MS;
      const stable = fast ? FAST_STABLE_MS : growing ? GROW_STABLE_MS : SAFE_STABLE_MS;

      if (now - vadRef.current.last < silence) return; // still speaking
      if (now - changedAt < stable) return; // words are still changing

      commit(now, fast ? "fast" : "safe");
    },
    [commit]
  );

  /* every 20 ms of audio: send it to Deepgram, and note when you start and stop speaking */
  const handleChunk = useCallback(
    (event: MessageEvent<{ pcm: Int16Array; rms: number }>) => {
      const now = performance.now();
      const { pcm, rms } = event.data;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(pcm.buffer as ArrayBuffer);
        audioSecRef.current += pcm.length / SAMPLE_RATE;
      } else if (pendingRef.current.length < 150) {
        pendingRef.current.push(pcm.buffer as ArrayBuffer);
        audioSecRef.current += pcm.length / SAMPLE_RATE;
      }

      const vad = vadRef.current;
      const utt = uttRef.current;

      if (!vad.speaking && rms < vad.noise * 2.5 + 0.004) vad.noise = vad.noise * 0.95 + rms * 0.05;

      if (rms > Math.max(0.01, vad.noise * 3)) {
        vad.run += 1;
        vad.last = now;
        if (!vad.speaking && vad.run >= 3) vad.speaking = true;
      } else {
        vad.run = 0;
        if (vad.speaking && now - vad.last > 600) vad.speaking = false;
      }

      if (vad.speaking) {
        if (!utt.sStart) utt.sStart = now - 60;
        utt.sEnd = vad.last;
      }

      maybeCommitEarly(now);
    },
    [maybeCommitEarly]
  );

  const startListening = useCallback(async () => {
    if (startingRef.current || wsRef.current) return;
    if (optionsRef.current.canListen && !optionsRef.current.canListen()) return;

    startingRef.current = true;
    setMicMessage("");
    setListening(true);
    setMicReady(false);

    const t0 = performance.now();

    try {
      // ask for the microphone and the voice token at the same time
      const [mic, tokenResult] = await Promise.allSettled([
        navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
        }),
        fetch("/api/deepgram-token", { cache: "no-store" }).then(async (res) => {
          const body = await res.json().catch(() => ({}));
          if (!res.ok || !body.token) throw new Error(body.error || "Could not get a voice token.");
          return body.token as string;
        }),
      ]);

      if (mic.status === "fulfilled") streamRef.current = mic.value;
      if (mic.status === "rejected") throw new Error("Microphone blocked. Allow the microphone and tap it again.");
      if (tokenResult.status === "rejected") throw tokenResult.reason;

      // the page was left while we were waiting
      if (!startingRef.current) {
        teardown();
        return;
      }

      const ctx = new AudioContext({ latencyHint: "interactive" });
      ctxRef.current = ctx;

      // a normal file from /public, so the site's Content Security Policy allows it
      await ctx.audioWorklet.addModule("/deepgram-worklet.js");

      const node = new AudioWorkletNode(ctx, "p");
      node.port.onmessage = handleChunk;
      ctx.createMediaStreamSource(mic.value).connect(node);

      const params = new URLSearchParams({
        model: MODEL,
        language: LANGUAGE,
        encoding: "linear16",
        sample_rate: String(SAMPLE_RATE),
        channels: "1",
        interim_results: "true",
        endpointing: String(ENDPOINTING_MS),
        utterance_end_ms: "1000",
        smart_format: String(SMART_FORMAT),
      });

      if (MODEL.startsWith("nova-3")) KEYTERMS.forEach((term) => params.append("keyterm", term));

      const socket = new WebSocket(`wss://api.deepgram.com/v1/listen?${params}`, ["bearer", tokenResult.value]);
      wsRef.current = socket;

      let opened = false;

      socket.onopen = () => {
        opened = true;
        startingRef.current = false;
        setConnectMs(Math.round(performance.now() - t0));

        // send the audio that was recorded while connecting, so the first word is not lost
        pendingRef.current.forEach((chunk) => socket.send(chunk));
        pendingRef.current = [];

        setMicReady(true);
      };

      socket.onmessage = handleMessage;

      socket.onclose = (event) => {
        if (wsRef.current !== socket) return; // we closed it ourselves
        teardown();
        setListening(false);
        setMicReady(false);
        setMicMessage(
          opened
            ? "Voice connection lost. Tap the microphone to start again."
            : `Could not connect to Deepgram (code ${event.code}). Check the key, model and language.`
        );
      };
    } catch (error) {
      teardown();
      setListening(false);
      setMicReady(false);
      setMicMessage(error instanceof Error ? error.message : "Could not start the microphone.");
    }
  }, [handleChunk, handleMessage, teardown]);

  // leaving the page closes the microphone and the connection
  useEffect(() => teardown, [teardown]);

  const stats = useMemo(() => {
    const finals = timings.map((t) => t.finalMs).filter((v): v is number => v !== null);
    const firsts = timings.map((t) => t.firstTextMs).filter((v): v is number => v !== null);

    return {
      count: timings.length,
      lastFinalMs: finals.length ? finals[finals.length - 1] : null,
      medianFinalMs: median(finals),
      medianFirstTextMs: median(firsts),
      fastCount: timings.filter((t) => t.how === "fast").length,
      safeCount: timings.filter((t) => t.how === "safe").length,
      finalCount: timings.filter((t) => t.how === "final").length,
      connectMs,
    };
  }, [timings, connectMs]);

  return {
    listening,
    heardText,
    micMessage,
    micReady,
    startListening,
    stopListening,
    clearHeard,
    timings,
    stats,
  };
}