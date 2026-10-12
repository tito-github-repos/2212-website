
import { useEffect, useRef, useState } from "react";
import { areAnswersEquivalent, toDisplayAnswer } from "./answerMatch";

type SpeechRecognitionType = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onnomatch: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}

type Options = {
  /** Called with the answer (digits when it is a number). Save it and move on here. */
  onAnswer: (text: string) => void;
  /** Returns the correct answer of the current question. */
  getCorrectAnswer: () => string;
  /** Return false when listening must not run (for example, quiz finished). */
  canListen?: () => boolean;
  /** Wait (ms) before accepting an answer that already matches the correct one. */
  fastMs?: number;
  /** Longest wait (ms) for the final result when the heard answer does not match yet. */
  slowMs?: number;
  /** Speech language. "en-IN" suits Indian English, use "en-US" for American English. */
  lang?: string;
};

const NUMBER_LIKE = /^-?\d+(\.\d+)?(\/\d+(\.\d+)?)?$/;

const MIC_ERRORS: Record<string, string> = {
  "not-allowed":
    "Microphone is blocked. Click the lock icon in the address bar and allow it.",
  "service-not-allowed":
    "Microphone is blocked. Click the lock icon in the address bar and allow it.",
  "audio-capture": "No microphone found.",
  network:
    "Can't reach the speech service. Check your internet and use Chrome or Edge (Brave does not support this).",
};

export function useVoiceAnswer({
  onAnswer,
  getCorrectAnswer,
  canListen = () => true,
  fastMs = 300,
  slowMs = 1500,
  lang = "en-IN",
}: Options) {
  const [listening, setListening] = useState(false);
  const [heardText, setHeardText] = useState("");
  const [micMessage, setMicMessage] = useState("");
  const [micReady, setMicReady] = useState(false); // true once the mic is really capturing

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const keepListeningRef = useRef(false);
  const listeningRef = useRef(false);
  const activeRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultSeqRef = useRef(0);

  // always point to the latest callbacks, so nothing becomes stale
  const onAnswerRef = useRef(onAnswer);
  const getCorrectRef = useRef(getCorrectAnswer);
  const canListenRef = useRef(canListen);

  onAnswerRef.current = onAnswer;
  getCorrectRef.current = getCorrectAnswer;
  canListenRef.current = canListen;

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function setListeningState(value: boolean) {
    listeningRef.current = value;
    setListening(value);

    if (!value) {
      setMicReady(false);
    }
  }

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
      keepListeningRef.current = false;
      clearTimer();

      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  function stopListening() {
    keepListeningRef.current = false;
    clearTimer();

    try {
      recognitionRef.current?.abort();
    } catch {}

    setListeningState(false);
  }

  function clearHeard() {
    setHeardText("");
  }

  // one listening session, it is replaced by a new one after every answer
  function startSession() {
    if (!activeRef.current || !keepListeningRef.current || !canListenRef.current()) {
      setListeningState(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      keepListeningRef.current = false;
      setListeningState(false);
      setMicMessage("Voice input needs Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SR();

    recognition.lang = lang;
    recognition.continuous = false; // one answer per session
    recognition.interimResults = true; // gives text while you speak
    recognition.maxAlternatives = 5; // lets us pick the best match

    recognitionRef.current = recognition;

    setMicReady(false);

    recognition.onaudiostart = () => {
      console.log("Mic is open, speak now");
      setMicReady(true);
    };

    recognition.onspeechstart = () => {
      console.log("Speech detected");
    };

    recognition.onnomatch = () => {
      console.log("Heard something but could not recognise it");
    };

    let submitted = false;
    let waiting = false;

    const submit = (text: string) => {
      if (submitted) return;

      submitted = true;
      waiting = false;
      clearTimer();

      try {
        recognition.abort();
      } catch {}

      if (!activeRef.current || !canListenRef.current()) return;

      const seq = resultSeqRef.current;

      onAnswerRef.current(text);

      // keep the recognised answer visible for a moment, unless new speech arrived
      setTimeout(() => {
        if (resultSeqRef.current === seq) {
          setHeardText("");
        }
      }, 400);

      // fresh session for the next question
      setTimeout(startSession, 80);
    };

    recognition.onresult = (event: any) => {
      if (submitted) return;

      const result = event.results[event.results.length - 1];
      const heard = String(result[0]?.transcript ?? "").trim();

      if (!heard) return;

      resultSeqRef.current += 1;

      // prefer the alternative that matches the correct answer
      const correctAnswer = getCorrectRef.current();

      let chosen = heard;
      let matched = areAnswersEquivalent(heard, correctAnswer);

      if (!matched) {
        for (let i = 0; i < result.length; i++) {
          const alt = String(result[i].transcript ?? "").trim();

          if (alt && areAnswersEquivalent(alt, correctAnswer)) {
            chosen = alt;
            matched = true;
            break;
          }
        }
      }

      const shown = toDisplayAnswer(chosen); // "one" -> "1"

      console.log(
        "Heard:",
        heard,
        "->",
        shown,
        matched ? "(matches)" : "(waiting for final)",
        "final:",
        result.isFinal
      );

      // the answer must be a number: ignore noise or a misheard word and keep listening
      const correctIsNumber = NUMBER_LIKE.test(toDisplayAnswer(correctAnswer));

      if (correctIsNumber && !NUMBER_LIKE.test(shown)) {
        setHeardText(`${heard} ?`);
        clearTimer();
        waiting = false; // when this session ends, a new one opens automatically
        return;
      }

      setHeardText(shown);

      clearTimer();
      waiting = true;

      const delay = result.isFinal ? 40 : matched ? fastMs : slowMs;

      timerRef.current = setTimeout(() => submit(shown), delay);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);

      if (event.error === "no-speech" || event.error === "aborted") {
        return; // onend opens a new session
      }

      submitted = true;
      keepListeningRef.current = false;
      clearTimer();
      setListeningState(false);

      setMicMessage(MIC_ERRORS[event.error] ?? `Voice error: ${event.error}`);
    };

    recognition.onend = () => {
      if (submitted || waiting) return; // the answer is being handled

      // the session ended in silence, open a new one
      if (keepListeningRef.current) {
        setTimeout(startSession, 150);
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Could not start recognition:", error);
      keepListeningRef.current = false;
      setListeningState(false);
    }
  }

  function startListening() {
    if (listeningRef.current || !canListenRef.current()) return;

    keepListeningRef.current = true;

    setListeningState(true);
    setMicMessage("");
    setHeardText("");

    startSession();
  }

  return {
    listening,
    heardText,
    micMessage,
    micReady,
    startListening,
    stopListening,
    clearHeard,
  };
}