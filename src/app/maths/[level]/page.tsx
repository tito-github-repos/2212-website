// "use client";

// import { useEffect, useRef, useState } from "react";
// import { useParams, useSearchParams, useRouter } from "next/navigation";

// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   orderBy,
//   query,
//   setDoc,
//   serverTimestamp,
//   where,
// } from "firebase/firestore";

// import { auth, db } from "@/lib/firebase";

// type Question = {
//   question: string;
//   answer: string;
//   category?: string;
// };

// type SpeechRecognitionType = {
//   lang: string;
//   continuous: boolean;
//   interimResults: boolean;
//   start: () => void;
//   stop: () => void;
//   onresult: ((event: any) => void) | null;
//   onend: (() => void) | null;
//   onerror: ((event: any) => void) | null;
// };

// declare global {
//   interface Window {
//     SpeechRecognition: new () => SpeechRecognitionType;
//     webkitSpeechRecognition: new () => SpeechRecognitionType;
//   }
// }

// export default function LevelPage() {
//   const params = useParams();
//   const searchParams = useSearchParams();
//   const router = useRouter();

//   const level = params.level as string;
//   const titleFromUrl = searchParams.get("title");

//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   const [answer, setAnswer] = useState("");
//   const [listening, setListening] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [started, setStarted] = useState(false);
//   const [completed, setCompleted] = useState(false);

//   const [oneMinuteMode, setOneMinuteMode] = useState(true);
//   const [quizSeconds, setQuizSeconds] = useState(60);

//   const [questionSeconds, setQuestionSeconds] = useState(0);
//   const [totalSeconds, setTotalSeconds] = useState(0);

//   const [score, setScore] = useState(0);
//   const [error, setError] = useState("");

//   const [studentId, setStudentId] = useState("");

//   const recognitionRef = useRef<SpeechRecognitionType | null>(null);
// const savingRef = useRef(false);

// const keepListeningRef = useRef(false);
// const spokenAnswerRef = useRef("");

// const answersRef = useRef<string[]>([]);
//   const questionsRef = useRef<Question[]>([]);
//   const currentQuestionRef = useRef(0);

//   const totalSecondsRef = useRef(0);

//   useEffect(() => {
//     questionsRef.current = questions;
//   }, [questions]);

//   useEffect(() => {
//     currentQuestionRef.current = currentQuestion;
//   }, [currentQuestion]);

//   useEffect(() => {
//     loadQuestions();
//   }, []);

//   async function loadStudent() {
//     const user = auth.currentUser;

//     if (!user) {
//       return "";
//     }

//     let id = user.uid;

//     try {
//       const studentQuery = query(
//         collection(db, "StudentRegister"),
//         where("email", "==", user.email),
//         orderBy("email")
//       );

//       const snapshot = await getDocs(studentQuery);

//       if (snapshot.docs.length > 0) {
//         id = snapshot.docs[0].id;
//       }
//     } catch (error) {
//       console.error("Error getting student:", error);
//     }

//     setStudentId(id);

//     return id;
//   }

//   async function loadQuestions() {
//     try {
//       setLoading(true);

//       await loadStudent();

//       const levelRef = doc(
//         db,
//         "QuestionBank",
//         "Maths",
//         "QuestionCategory",
//         level
//       );

//       const levelSnap = await getDoc(levelRef);

//       if (!levelSnap.exists()) {
//         setError("Questions not found");
//         setLoading(false);
//         return;
//       }

//       const levelData = levelSnap.data();

//       const categories = Array.isArray(levelData.categories)
//         ? levelData.categories
//         : [];

//       const loadedQuestions: Question[] = [];

//       for (const category of categories) {
//         const categoryName = String(category);

//         const questionsRef = collection(
//           db,
//           "QuestionBank",
//           "Maths",
//           "QuestionCategory",
//           level,
//           categoryName
//         );

//         const questionsQuery = query(
//           questionsRef,
//           orderBy("order", "asc")
//         );

//         const snapshot = await getDocs(questionsQuery);

//         snapshot.forEach((questionDoc) => {
//           const data = questionDoc.data();

//           loadedQuestions.push({
//             question: String(data.question ?? ""),
//             answer: String(data.answer ?? ""),
//             category: categoryName,
//           });
//         });
//       }

//       setQuestions(loadedQuestions);

//       questionsRef.current = loadedQuestions;

//       answersRef.current = new Array(loadedQuestions.length).fill("");

//       setLoading(false);
//     } catch (error) {
//       console.error("Error loading questions:", error);
//       setError("Unable to load questions");
//       setLoading(false);
//     }
//   }

//   useEffect(() => {
//     if (!started || completed) return;

//     const timer = setInterval(() => {
//       setTotalSeconds((seconds) => {
//         const newSeconds = seconds + 1;
//         totalSecondsRef.current = newSeconds;
//         return newSeconds;
//       });

//       setQuestionSeconds((seconds) => seconds + 1);

//       if (oneMinuteMode) {
//         setQuizSeconds((seconds) => {
//           if (seconds > 0) {
//             return seconds - 1;
//           }

//           return 0;
//         });
//       }
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [started, completed, oneMinuteMode]);

//   useEffect(() => {
//     if (!started || completed) return;

//     if (oneMinuteMode && quizSeconds === 0) {
//       finishQuiz();
//     }
//   }, [quizSeconds, started, completed, oneMinuteMode]);

//   function startQuiz() {
//     if (questions.length === 0) return;

//     setStarted(true);
//     setCompleted(false);

//     setCurrentQuestion(0);
//     currentQuestionRef.current = 0;

//     setAnswer("");

//     setQuestionSeconds(0);

//     setTotalSeconds(0);
//     totalSecondsRef.current = 0;

//     if (oneMinuteMode) {
//       setQuizSeconds(60);
//     }

//     answersRef.current = new Array(questions.length).fill("");
//   }

//   function normalizeAnswer(value: string) {
//     let text = value.toLowerCase().trim();

//     text = text.replace(/\s+/g, "");

//     if (text.startsWith(".")) {
//       text = "0" + text;
//     }

//     text = text.replace("²", "^2");
//     text = text.replace("³", "^3");

//     return text;
//   }

//   function areAnswersEquivalent(
//     userAnswer: string,
//     correctAnswer: string
//   ) {
//     const user = normalizeAnswer(userAnswer);
//     const correct = normalizeAnswer(correctAnswer);

//     if (user === correct) {
//       return true;
//     }

//     const userNumber = Number(user);
//     const correctNumber = Number(correct);

//     if (
//       !Number.isNaN(userNumber) &&
//       !Number.isNaN(correctNumber)
//     ) {
//       const userFixed =
//         Math.trunc(userNumber * 10000) / 10000;

//       const correctFixed =
//         Math.trunc(correctNumber * 10000) / 10000;

//       return userFixed === correctFixed;
//     }

//     return false;
//   }

//   function calculateQuestionBadge(
//     secondsTaken: number,
//     isCorrect: boolean
//   ) {
//     if (!isCorrect) return "";

//     if (secondsTaken < 30) return "Excellent";

//     if (secondsTaken < 60) return "Very Good";

//     if (secondsTaken < 120) return "Good";

//     return "";
//   }

//   async function saveAnswer(
//     questionIndex: number,
//     userAnswer: string,
//     isSubmit: boolean,
//     secondsTaken: number
//   ) {
//     if (!studentId) {
//       return;
//     }

//     const currentQuestions = questionsRef.current;

//     if (
//       questionIndex < 0 ||
//       questionIndex >= currentQuestions.length
//     ) {
//       return;
//     }

//     const current = currentQuestions[questionIndex];

//     const correct = areAnswersEquivalent(
//       userAnswer,
//       current.answer
//     );

//     const questionId = `Q${questionIndex + 1}`;

//     const answerRef = doc(
//       db,
//       "StudentAnswerSheet",
//       studentId,
//       "Maths",
//       "QuestionCategory",
//       level,
//       questionId
//     );

//     const badge = calculateQuestionBadge(
//       secondsTaken,
//       correct
//     );

//     await setDoc(
//       answerRef,
//       {
//         question: current.question,
//         answer: userAnswer,
//         correctAnswer: current.answer,
//         score: correct ? 1 : 0,
//         scoreText: correct ? "Pass" : "Fail",
//         badge: badge,
//         latestSecondsTaken: secondsTaken,
//         attemptDateTime: serverTimestamp(),
//         isSubmit: isSubmit,
//       },
//       { merge: true }
//     );
//   }

//   async function moveToNextQuestion(userAnswer: string) {
//     if (savingRef.current || completed) return;

//     savingRef.current = true;

//     const index = currentQuestionRef.current;

//     answersRef.current[index] = userAnswer;

//     try {
//       await saveAnswer(
//         index,
//         userAnswer,
//         false,
//         questionSeconds
//       );

//       if (index >= questionsRef.current.length - 1) {
//         await finishQuiz();
//         return;
//       }

//       const nextIndex = index + 1;

//       currentQuestionRef.current = nextIndex;

//       setCurrentQuestion(nextIndex);

//       setAnswer("");

//       setQuestionSeconds(0);
//     } catch (error) {
//       console.error("Error saving answer:", error);
//     } finally {
//       savingRef.current = false;
//     }
//   }

//  async function startListening() {
//   if (listening || completed) return;

//   const SpeechRecognition =
//     window.SpeechRecognition ||
//     window.webkitSpeechRecognition;

//   if (!SpeechRecognition) {
//     alert("Voice recognition is not supported in this browser.");
//     return;
//   }

//   const recognition = new SpeechRecognition();

//   recognition.lang = "en-US";
//   recognition.continuous = false;
//   recognition.interimResults = false;

//   recognitionRef.current = recognition;

//   keepListeningRef.current = true;
//   spokenAnswerRef.current = "";

//   setListening(true);
//   setAnswer("");

//   recognition.onresult = (event: any) => {
//     const result = event.results?.[0]?.[0];

//     if (!result) {
//       return;
//     }

//     const spokenText = result.transcript?.trim() || "";

//     if (spokenText === "") {
//       return;
//     }

//     spokenAnswerRef.current = spokenText;
//     keepListeningRef.current = false;

//     setAnswer(spokenText);

//     recognition.stop();

//     setTimeout(async () => {
//       await moveToNextQuestion(spokenText);

//       spokenAnswerRef.current = "";
//       setListening(false);
//     }, 700);
//   };

//   recognition.onerror = (event: any) => {
//     if (
//       event.error === "no-speech" ||
//       event.error === "aborted"
//     ) {
//       return;
//     }

//     console.error("Speech recognition error:", event.error);

//     if (event.error === "not-allowed") {
//       keepListeningRef.current = false;
//       setListening(false);
//       alert("Microphone permission is blocked.");
//       return;
//     }

//     if (event.error === "audio-capture") {
//       keepListeningRef.current = false;
//       setListening(false);
//       alert("Microphone is not available.");
//       return;
//     }
//   };

//   recognition.onend = () => {
//     if (keepListeningRef.current && !completed) {
//       setTimeout(() => {
//         try {
//           recognition.start();
//         } catch (error) {
//           console.log("Speech recognition restart:", error);
//         }
//       }, 300);

//       return;
//     }

//     if (!spokenAnswerRef.current) {
//       setListening(false);
//     }
//   };

//   recognition.start();
// }

//   async function finishQuiz() {
//     if (completed) return;

//     setCompleted(true);

//     if (recognitionRef.current) {
//       recognitionRef.current.stop();
//     }

//     const currentQuestions = questionsRef.current;

//     let finalScore = 0;

//     for (let i = 0; i < currentQuestions.length; i++) {
//       const userAnswer = answersRef.current[i] || "";

//       if (
//         areAnswersEquivalent(
//           userAnswer,
//           currentQuestions[i].answer
//         )
//       ) {
//         finalScore++;
//       }
//     }

//     setScore(finalScore);

//     if (!studentId) {
//       return;
//     }

//     try {
//       const answersRef = collection(
//         db,
//         "StudentAnswerSheet",
//         studentId,
//         "Maths",
//         "QuestionCategory",
//         level
//       );

//       const answersSnapshot = await getDocs(answersRef);

//       let savedTotalSeconds = 0;

//       answersSnapshot.forEach((answerDoc) => {
//         const data = answerDoc.data();

//         savedTotalSeconds +=
//           Number(data.latestSecondsTaken ?? 0);
//       });

//       const averageSeconds =
//         currentQuestions.length > 0
//           ? Math.floor(
//               savedTotalSeconds / currentQuestions.length
//             )
//           : 0;

//       const wrongAnswers =
//         currentQuestions.length - finalScore;

//       let badge = "Good";

//       if (wrongAnswers === 0) {
//         if (averageSeconds <= 30) {
//           badge = "Excellent";
//         } else if (averageSeconds <= 60) {
//           badge = "Very Good";
//         }
//       } else if (wrongAnswers <= 2) {
//         badge = "Very Good";
//       }

//       const scoreRef = doc(
//         db,
//         "StudentScoreSheet",
//         studentId,
//         "Maths",
//         "QuestionCategory",
//         level,
//         "scoreData"
//       );

//       await setDoc(
//         scoreRef,
//         {
//           studentId: studentId,
//           subject: "Maths",
//           category: "QuestionCategory",
//           level: level,
//           score: finalScore,
//           categoryName:
//             titleFromUrl ||
//             currentQuestions[0]?.category ||
//             level,
//           totalNoQuestions: currentQuestions.length,
//           status: "Completed",
//           latestBadge: badge,
//           latestTotalSeconds: savedTotalSeconds,
//           latestAverageSeconds: averageSeconds,
//           latestAttemptStartTime:
//             serverTimestamp(),
//           latestAttemptEndTime:
//             serverTimestamp(),
//           updatedAt: serverTimestamp(),
//         },
//         { merge: true }
//       );
//     } catch (error) {
//       console.error(
//         "Error saving score:",
//         error
//       );
//     }
//   }

//   function formatTime(seconds: number) {
//     const minutes = Math.floor(seconds / 60);

//     const remainingSeconds = seconds % 60;

//     return `${String(minutes).padStart(
//       2,
//       "0"
//     )}:${String(remainingSeconds).padStart(2, "0")}`;
//   }

//   if (loading) {
//     return (
//       <main className="min-h-screen flex items-center justify-center bg-white">
//         <p className="text-gray-600">
//           Loading...
//         </p>
//       </main>
//     );
//   }

//   if (error) {
//     return (
//       <main className="min-h-screen flex items-center justify-center bg-white">
//         <p className="text-red-500">
//           {error}
//         </p>
//       </main>
//     );
//   }

//   if (!started) {
//     return (
//       <main className="min-h-screen bg-white px-5 py-8">
//         <div className="max-w-xl mx-auto">
//           <h1 className="text-3xl font-bold text-center mb-8">
//             Instructions
//           </h1>

//           <div className="rounded-3xl bg-gray-50 p-6 shadow-sm">
//             <h2 className="text-xl font-bold mb-5">
//               Enable 1 Minute Mode
//             </h2>

//             <div className="flex items-center justify-between mb-7">
//               <p className="text-gray-600">
//                 Automatically save after 1 minute
//                 whether you answered all questions
//                 or not.
//               </p>

//               <input
//                 type="checkbox"
//                 checked={oneMinuteMode}
//                 onChange={(e) =>
//                   setOneMinuteMode(e.target.checked)
//                 }
//                 className="w-5 h-5"
//               />
//             </div>

//             <h2 className="text-xl font-bold mb-3">
//               General
//             </h2>

//             <p className="text-gray-600 mb-2">
//               There are ten tests here. Each test has
//               60 numerical.
//             </p>

//             <p className="text-gray-600 mb-2">
//               You need to solve each test by less than
//               a minute.
//             </p>

//             <p className="text-gray-600 mb-2">
//               The goal is to solve within 30 seconds.
//             </p>

//             <p className="text-gray-600 mb-2">
//               Excellent: Solving it by less than 30
//               seconds.
//             </p>

//             <p className="text-gray-600 mb-2">
//               Very Good: Solving it by less than 60
//               seconds.
//             </p>

//             <p className="text-gray-600 mb-6">
//               Good: Solving it by less than 120
//               seconds.
//             </p>

//             <h2 className="text-xl font-bold mb-3">
//               Specifics
//             </h2>

//             <p className="text-gray-600 mb-2">
//               Getting full score of 60 out of 60 is our
//               target.
//             </p>

//             <p className="text-gray-600 mb-2">
//               If you are getting a score of 59/58 is ok.
//             </p>

//             <p className="text-gray-600 mb-6">
//               If you are getting 57 and less than that,
//               you can repeat the test.
//             </p>

//             <button
//               onClick={startQuiz}
//               className="w-full rounded-2xl bg-black py-4 text-white font-bold"
//             >
//               Start
//             </button>
//           </div>
//         </div>
//       </main>
//     );
//   }

//   if (completed) {
//     return (
//       <main className="min-h-screen bg-white flex items-center justify-center px-5">
//         <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg border">
//           <h1 className="text-3xl font-bold mb-5">
//             Quiz Completed!
//           </h1>

//           <p className="text-gray-500 mb-2">
//             Your Score
//           </p>

//           <p className="text-5xl font-bold mb-8">
//             {score} / {questions.length}
//           </p>

//           <button
//             onClick={() => router.push("/maths")}
//             className="w-full rounded-2xl bg-black py-4 text-white font-bold"
//           >
//             Back to Home
//           </button>
//         </div>
//       </main>
//     );
//   }

//   const current = questions[currentQuestion];

//   return (
//     <main className="min-h-screen bg-white">
//       <div className="mx-auto max-w-3xl px-5 py-5">

//         <div className="flex items-center justify-between mb-10">
//           <button
//             onClick={() => router.back()}
//             className="text-3xl"
//           >
//             ←
//           </button>

//           <h1 className="text-2xl font-bold">
//             {titleFromUrl ||
//               current.category ||
//               "Addition"}
//           </h1>

//           <div className="text-right">
//             {oneMinuteMode && (
//               <div className="text-sm font-bold text-red-500">
//                 Quiz : {formatTime(quizSeconds)}
//               </div>
//             )}

//             <div className="text-lg font-bold">
//               {currentQuestion + 1}/{questions.length}
//             </div>
//           </div>
//         </div>

//         <div className="flex justify-center mb-8">
//           <div className="rounded-full border-2 border-black px-6 py-3 text-lg font-bold">
//             ⏱ {formatTime(totalSeconds)}
//           </div>
//         </div>

//         <div className="rounded-3xl bg-white p-10 text-center shadow-lg border mb-10">
//           <h2 className="text-4xl font-bold">
//             {current.question}
//           </h2>
//         </div>

//         <button
//   onClick={startListening}
//   disabled={listening}
//   className="w-full rounded-3xl bg-white border p-6 shadow-lg flex items-center justify-between"
// >
//   <span className="text-gray-500 font-semibold text-lg">
//   {answer
//     ? answer
//     : listening
//     ? "Listening..."
//     : "Tap microphone to speak your answer..."}
// </span>

//   <span className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-3xl">
//     🎙️
//   </span>
// </button>

//       </div>
//     </main>
//   );
// }

"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import { keyframes } from "@emotion/react";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MicIcon from "@mui/icons-material/Mic";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { formatTime, getBadgeIcon, getResultInfo } from "../../../lib/quizRules";
import { useVoiceAnswer } from "../../../lib/useVoiceAnswer";
import {
  useQuestionController,
  type SubmitResult,
} from "../../../lib/useQuestionController";

const SUBJECT = "Maths";

const GENERAL_LINES = [
  "There are ten tests here. Each test has 60 numerical.",
  "You need to solve each test by less than a minute.",
  "The goal is to solve within 30 seconds.",
  "Excellent: Solving it by less than 30 seconds.",
  "Very Good: Solving it by less than 60 seconds.",
  "Good: Solving it by less than 120 seconds.",
];

const SPECIFIC_LINES = [
  "Getting full score of 60 out of 60 is our target.",
  "If you are getting a score of 59/58 is ok.",
  "If you are getting 57 and less than that, you can repeat the test.",
];

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.55); }
  70% { box-shadow: 0 0 0 16px rgba(249, 115, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
`;

const pageSx = { minHeight: "100vh", bgcolor: "#fff", color: "text.primary" };

const blackButtonSx = {
  py: 1.75,
  borderRadius: 4,
  bgcolor: "#000",
  color: "#fff",
  "&:hover": { bgcolor: "#222" },
};

const outlinedButtonSx = {
  py: 1.5,
  borderRadius: 4,
  color: "#000",
  borderColor: "#000",
  "&:hover": { borderColor: "#000", bgcolor: "grey.100" },
};

/* The outer page gives every level its own copy of the quiz.
   Without the key, "Move to Next Level" would keep the old level's state. */
export default function LevelPage() {
  const params = useParams();
  const level = params.level as string;

  return (
    <Suspense fallback={null}>
      <LevelQuiz key={level} level={level} />
    </Suspense>
  );
}

function LevelQuiz({ level }: { level: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const titleFromUrl = searchParams.get("title");

  const controller = useQuestionController(SUBJECT, level);

  const {
    questions,
    currentQuestionIndex,
    isLoading,
    error,
    totalScore,
    totalElapsedSeconds,
    previous,
    savedCount,
    student,
  } = controller;

  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  // true after "Retry Test" is pressed on the score page
  const [retrying, setRetrying] = useState(false);

  const [oneMinuteMode, setOneMinuteMode] = useState(false);
  const [quizSeconds, setQuizSeconds] = useState(60);

  const finishedRef = useRef(false);

  const title = titleFromUrl || questions[0]?.category || "Addition";

  /* ------------------------------- voice ---------------------------------- */

  const { listening, heardText, micMessage, micReady, startListening, stopListening, clearHeard } =
    useVoiceAnswer({
      onAnswer: (text) => handleAnswer(text),
      getCorrectAnswer: () => controller.getCorrectAnswer(),
      canListen: () => !finishedRef.current,
    });

  function handleAnswer(text: string) {
    if (finishedRef.current) return;

    if (controller.isLastQuestion()) {
      void finishQuiz(text);
      return;
    }

    controller.nextQuestion(text);
  }

  /* -------------------------------- quiz ---------------------------------- */

  // retrying = true: the old attempt goes to history and every answer is cleared
  // retrying = false: continue from the first unanswered question
  async function startQuiz() {
    if (starting || questions.length === 0) return;

    setStarting(true);

    try {
      await controller.startAttempt(retrying);

      finishedRef.current = false;
      setResult(null);
      setCompleted(false);
      setQuizSeconds(60);
      clearHeard();
      setStarted(true);

      // open the microphone right away, so it is ready for the first question
      startListening();
    } catch (e) {
      console.error("Could not start the test:", e);
    } finally {
      setStarting(false);
    }
  }

  async function finishQuiz(lastAnswer: string) {
    if (finishedRef.current) return;

    finishedRef.current = true;
    setCompleted(true);
    stopListening();

    const submitResult = await controller.submitQuiz(lastAnswer);
    setResult(submitResult);
  }

  // leave half way: answers stay saved and the level shows as in progress
  async function handleBack() {
    if (!started || completed) {
      router.push("/maths");
      return;
    }

    if (leaving) return;

    setLeaving(true);
    finishedRef.current = true;
    stopListening();

    await controller.saveAndClose("");

    router.push("/maths");
  }

  /* ------------------------------ 1 minute mode ---------------------------- */

  useEffect(() => {
    if (!started || completed || !oneMinuteMode) return;

    const timer = setInterval(() => {
      setQuizSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed, oneMinuteMode]);

  useEffect(() => {
    if (started && !completed && oneMinuteMode && quizSeconds === 0) {
      void finishQuiz("");
    }
  }, [quizSeconds, started, completed, oneMinuteMode]);

  /* --------------------------------- UI ------------------------------------ */

  if (isLoading) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
        <CircularProgress size={28} sx={{ color: "#000" }} />
        <Typography color="text.secondary">Loading...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  /* ------------------------ score page (already taken) --------------------- */

  const alreadyCompleted = previous?.status === "Completed";

  if (!started && alreadyCompleted && !retrying) {
    const score = Number(previous?.score ?? 0);
    const total = Number(previous?.totalNoQuestions ?? questions.length);

    const info = getResultInfo(score, total);

    // a badge only exists for a good score (older saved results may have one by mistake)
    const badge = info.status === "repeat" ? "" : String(previous?.latestBadge ?? "");
    const seconds = typeof previous?.latestTotalSeconds === "number" ? previous.latestTotalSeconds : null;

    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2.5, py: 4 }}>
        <Paper elevation={8} sx={{ width: "100%", maxWidth: 480, p: { xs: 3, sm: 4 }, borderRadius: 6, textAlign: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            {title} Score
          </Typography>

          <Avatar sx={{ width: 96, height: 96, bgcolor: "grey.100", fontSize: 48, mx: "auto", mb: 2 }}>
            {info.icon}
          </Avatar>

          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Your Score
          </Typography>

          <Typography variant="h2" sx={{ fontWeight: 700 }}>
            {score} / {total}
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 700, color: info.color, mt: 1, mb: 2 }}>
            {info.title}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "center", mb: 2 }}>
            {badge && (
              <Chip
                label={`${getBadgeIcon(badge)} ${badge}`}
                color="success"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}

            {seconds !== null && (
              <Chip
                icon={<TimerOutlinedIcon />}
                label={formatTime(seconds)}
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>

          <Alert severity={info.severity} sx={{ mb: 3, textAlign: "left" }}>
            {info.message}
          </Alert>

          <Stack spacing={1.5}>
            <Button fullWidth size="large" variant="contained" onClick={() => setRetrying(true)} sx={blackButtonSx}>
              Retry Test
            </Button>

            <Button fullWidth size="large" variant="outlined" onClick={() => router.push("/maths")} sx={outlinedButtonSx}>
              Back to Levels
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  /* ----------------------------- instructions ------------------------------ */

  if (!started) {
    const canResume = !alreadyCompleted && savedCount > 0;

    return (
      <Box sx={{ ...pageSx, px: 2.5, py: 4 }}>
        <Container maxWidth="sm" disableGutters>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <IconButton
              aria-label="Back"
              onClick={() => (retrying ? setRetrying(false) : router.push("/maths"))}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography variant="h4" sx={{ fontWeight: 700, textAlign: "center", flex: 1, pr: 5 }}>
              Instructions
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 6, bgcolor: "grey.50", borderColor: "grey.200" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              {title}
            </Typography>

            {student.isGuest && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You are not logged in, so your answers will not be saved.
              </Alert>
            )}

            {retrying && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Starting again keeps your previous attempt in your history.
              </Alert>
            )}

            {canResume && (
              <Alert severity="info" sx={{ mb: 2 }}>
                You already answered {savedCount} of {questions.length} questions. Start will
                continue from question {currentQuestionIndex + 1}.
              </Alert>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Enable 1 Minute Mode
            </Typography>

            <FormControlLabel
              labelPlacement="start"
              sx={{ m: 0, mb: 3, width: "100%", justifyContent: "space-between" }}
              control={
                <Switch
                  checked={oneMinuteMode}
                  onChange={(e) => setOneMinuteMode(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#000" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#000",
                    },
                  }}
                />
              }
              label={
                <Typography color="text.secondary" sx={{ pr: 2 }}>
                  Automatically save after 1 minute whether you answered all questions or not.
                </Typography>
              }
            />

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              General
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {GENERAL_LINES.map((line) => (
                <Typography key={line} color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Specifics
            </Typography>

            <Stack spacing={1} sx={{ mb: 3 }}>
              {SPECIFIC_LINES.map((line) => (
                <Typography key={line} color="text.secondary">
                  {line}
                </Typography>
              ))}
            </Stack>

            <Button
              fullWidth
              size="large"
              variant="contained"
              disabled={starting}
              onClick={startQuiz}
              sx={blackButtonSx}
            >
              {starting ? "Starting..." : "Start"}
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  /* -------------------------------- result --------------------------------- */

  if (completed) {
    const info = getResultInfo(totalScore, questions.length);
    const badge = result?.badge ?? "";

    return (
      <Box sx={{ ...pageSx, display: "flex", alignItems: "center", justifyContent: "center", px: 2.5, py: 3 }}>
        <Paper elevation={8} sx={{ width: "100%", maxWidth: 440, p: 4, borderRadius: 6, textAlign: "center" }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2.5 }}>
            {student.isGuest ? "Quiz Completed!" : "Level Completed!"}
          </Typography>

          {student.isGuest ? (
            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              Login to save your progress and view activity.
            </Alert>
          ) : (
            <>
              <Avatar sx={{ width: 96, height: 96, bgcolor: "grey.100", fontSize: 48, mx: "auto", mb: 2 }}>
                {info.icon}
              </Avatar>

              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Your Score
              </Typography>

              <Typography variant="h2" sx={{ fontWeight: 700 }}>
                {totalScore} / {questions.length}
              </Typography>

              <Typography variant="h5" sx={{ fontWeight: 700, color: info.color, mt: 1, mb: 2 }}>
                {info.title}
              </Typography>

              {!result && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
                  <Typography variant="caption" color="text.secondary">
                    Saving your score...
                  </Typography>
                </Box>
              )}

              {result && (
                <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: "center" }}>
                  {badge && (
                    <Chip
                      label={`${getBadgeIcon(badge)} ${badge}`}
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 700 }}
                    />
                  )}

                  <Chip
                    icon={<TimerOutlinedIcon />}
                    label={formatTime(result.totalSeconds)}
                    variant="outlined"
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>
              )}

              {result?.error && (
                <Alert severity="warning" sx={{ mb: 2, textAlign: "left" }}>
                  {result.error}
                </Alert>
              )}

              {result && (
                <Alert severity={info.severity} sx={{ mb: 3, textAlign: "left" }}>
                  {info.message}
                </Alert>
              )}
            </>
          )}

          <Stack spacing={1.5}>
            {student.isGuest && (
              <Button fullWidth size="large" variant="contained" onClick={() => router.push("/")} sx={blackButtonSx}>
                Login
              </Button>
            )}

            {!student.isGuest && result?.nextLevel && (
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={() =>
                  router.push(
                    `/maths/${result.nextLevel!.levelId}?title=${encodeURIComponent(result.nextLevel!.categoryName)}`
                  )
                }
                sx={blackButtonSx}
              >
                Move to Next Level
              </Button>
            )}

            <Button
              fullWidth
              size="large"
              variant={student.isGuest || result?.nextLevel ? "outlined" : "contained"}
              disabled={!student.isGuest && !result}
              onClick={() => router.push("/maths")}
              sx={student.isGuest || result?.nextLevel ? outlinedButtonSx : blackButtonSx}
            >
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  /* ---------------------------------- quiz --------------------------------- */

  const current = questions[currentQuestionIndex];

  const micText = heardText
    ? heardText
    : listening
    ? micReady
      ? "Speak now..."
      : "Starting microphone..."
    : "Tap microphone to speak your answer...";

  return (
    <Box sx={pageSx}>
      <Container maxWidth="md" sx={{ py: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <IconButton aria-label="Back" onClick={handleBack} disabled={leaving}>
            <ArrowBackIcon />
          </IconButton>

          <Typography variant="h5" sx={{ fontWeight: 700, textAlign: "center", flex: 1, px: 1 }}>
            {title}
          </Typography>

          <Box sx={{ textAlign: "right", minWidth: 84 }}>
            {oneMinuteMode && (
              <Typography variant="caption" color="error" sx={{ fontWeight: 700, display: "block" }}>
                Quiz : {formatTime(quizSeconds)}
              </Typography>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {currentQuestionIndex + 1}/{questions.length}
            </Typography>
          </Box>
        </Box>

        {oneMinuteMode && (
          <LinearProgress
            variant="determinate"
            value={(quizSeconds / 60) * 100}
            sx={{
              mb: 3,
              height: 8,
              borderRadius: 4,
              bgcolor: "grey.200",
              "& .MuiLinearProgress-bar": { bgcolor: quizSeconds <= 10 ? "#dc2626" : "#000" },
            }}
          />
        )}

        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Chip
            icon={<TimerOutlinedIcon />}
            label={formatTime(totalElapsedSeconds)}
            variant="outlined"
            sx={{ height: 48, px: 1, fontSize: 18, fontWeight: 700, borderWidth: 2, borderColor: "text.primary" }}
          />
        </Box>

        <Paper elevation={6} sx={{ p: { xs: 4, sm: 5 }, textAlign: "center", borderRadius: 6, mb: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, fontSize: { xs: "2rem", sm: "3rem" } }}>
            {current?.question}
          </Typography>
        </Paper>

        <Card elevation={6} sx={{ borderRadius: 6 }}>
          <CardActionArea
            onClick={startListening}
            disabled={listening}
            sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }} color={heardText ? "text.primary" : "text.secondary"}>
              {micText}
            </Typography>

            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: listening && micReady ? "#fdba74" : "#ffedd5",
                color: "#c2410c",
                animation: listening && micReady ? `${pulse} 1.4s infinite` : "none",
              }}
            >
              <MicIcon fontSize="large" />
            </Avatar>
          </CardActionArea>
        </Card>

        {micMessage && (
          <Alert severity="error" variant="outlined" sx={{ mt: 2 }}>
            {micMessage}
          </Alert>
        )}
      </Container>
    </Box>
  );
}