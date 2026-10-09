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

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MicIcon from "@mui/icons-material/Mic";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { auth, db } from "@/lib/firebase";

type Question = {
  question: string;
  answer: string;
  category?: string;
};

type SpeechRecognitionType = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionType;
    webkitSpeechRecognition: new () => SpeechRecognitionType;
  }
}

const generalPoints = [
  "There are ten tests here. Each test has 60 numerical.",
  "You need to solve each test by less than a minute.",
  "The goal is to solve within 30 seconds.",
  "Excellent: Solving it by less than 30 seconds.",
  "Very Good: Solving it by less than 60 seconds.",
  "Good: Solving it by less than 120 seconds.",
];

const specificPoints = [
  "Getting full score of 60 out of 60 is our target.",
  "If you are getting a score of 59/58 is ok.",
  "If you are getting 57 and less than that, you can repeat the test.",
];

function CenteredMessage({
  children,
  color = "text.secondary",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

export default function LevelPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const level = params.level as string;
  const titleFromUrl = searchParams.get("title");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);

  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [oneMinuteMode, setOneMinuteMode] = useState(true);
  const [quizSeconds, setQuizSeconds] = useState(60);

  const [questionSeconds, setQuestionSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const [score, setScore] = useState(0);
  const [error, setError] = useState("");

  const [studentId, setStudentId] = useState("");

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const savingRef = useRef(false);

  const keepListeningRef = useRef(false);
  const spokenAnswerRef = useRef("");

  const answersRef = useRef<string[]>([]);
  const questionsRef = useRef<Question[]>([]);
  const currentQuestionRef = useRef(0);

  const totalSecondsRef = useRef(0);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadStudent() {
    const user = auth.currentUser;

    if (!user) {
      return "";
    }

    let id = user.uid;

    try {
      const studentQuery = query(
        collection(db, "StudentRegister"),
        where("email", "==", user.email),
        orderBy("email")
      );

      const snapshot = await getDocs(studentQuery);

      if (snapshot.docs.length > 0) {
        id = snapshot.docs[0].id;
      }
    } catch (error) {
      console.error("Error getting student:", error);
    }

    setStudentId(id);

    return id;
  }

  async function loadQuestions() {
    try {
      setLoading(true);

      await loadStudent();

      const levelRef = doc(
        db,
        "QuestionBank",
        "Maths",
        "QuestionCategory",
        level
      );

      const levelSnap = await getDoc(levelRef);

      if (!levelSnap.exists()) {
        setError("Questions not found");
        setLoading(false);
        return;
      }

      const levelData = levelSnap.data();

      const categories = Array.isArray(levelData.categories)
        ? levelData.categories
        : [];

      const loadedQuestions: Question[] = [];

      for (const category of categories) {
        const categoryName = String(category);

        const categoryCollectionRef = collection(
          db,
          "QuestionBank",
          "Maths",
          "QuestionCategory",
          level,
          categoryName
        );

        const questionsQuery = query(
          categoryCollectionRef,
          orderBy("order", "asc")
        );

        const snapshot = await getDocs(questionsQuery);

        snapshot.forEach((questionDoc) => {
          const data = questionDoc.data();

          loadedQuestions.push({
            question: String(data.question ?? ""),
            answer: String(data.answer ?? ""),
            category: categoryName,
          });
        });
      }

      setQuestions(loadedQuestions);

      questionsRef.current = loadedQuestions;

      answersRef.current = new Array(loadedQuestions.length).fill("");

      setLoading(false);
    } catch (error) {
      console.error("Error loading questions:", error);
      setError("Unable to load questions");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!started || completed) return;

    const timer = setInterval(() => {
      setTotalSeconds((seconds) => {
        const newSeconds = seconds + 1;
        totalSecondsRef.current = newSeconds;
        return newSeconds;
      });

      setQuestionSeconds((seconds) => seconds + 1);

      if (oneMinuteMode) {
        setQuizSeconds((seconds) => {
          if (seconds > 0) {
            return seconds - 1;
          }

          return 0;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [started, completed, oneMinuteMode]);

  useEffect(() => {
    if (!started || completed) return;

    if (oneMinuteMode && quizSeconds === 0) {
      finishQuiz();
    }
  }, [quizSeconds, started, completed, oneMinuteMode]);

  function startQuiz() {
    if (questions.length === 0) return;

    setStarted(true);
    setCompleted(false);

    setCurrentQuestion(0);
    currentQuestionRef.current = 0;

    setAnswer("");

    setQuestionSeconds(0);

    setTotalSeconds(0);
    totalSecondsRef.current = 0;

    if (oneMinuteMode) {
      setQuizSeconds(60);
    }

    answersRef.current = new Array(questions.length).fill("");
  }

  function normalizeAnswer(value: string) {
    let text = value.toLowerCase().trim();

    text = text.replace(/\s+/g, "");

    if (text.startsWith(".")) {
      text = "0" + text;
    }

    text = text.replace("²", "^2");
    text = text.replace("³", "^3");

    return text;
  }

  function areAnswersEquivalent(userAnswer: string, correctAnswer: string) {
    const user = normalizeAnswer(userAnswer);
    const correct = normalizeAnswer(correctAnswer);

    if (user === correct) {
      return true;
    }

    const userNumber = Number(user);
    const correctNumber = Number(correct);

    if (!Number.isNaN(userNumber) && !Number.isNaN(correctNumber)) {
      const userFixed = Math.trunc(userNumber * 10000) / 10000;
      const correctFixed = Math.trunc(correctNumber * 10000) / 10000;

      return userFixed === correctFixed;
    }

    return false;
  }

  function calculateQuestionBadge(secondsTaken: number, isCorrect: boolean) {
    if (!isCorrect) return "";

    if (secondsTaken < 30) return "Excellent";

    if (secondsTaken < 60) return "Very Good";

    if (secondsTaken < 120) return "Good";

    return "";
  }

  async function saveAnswer(
    questionIndex: number,
    userAnswer: string,
    isSubmit: boolean,
    secondsTaken: number
  ) {
    if (!studentId) {
      return;
    }

    const currentQuestions = questionsRef.current;

    if (questionIndex < 0 || questionIndex >= currentQuestions.length) {
      return;
    }

    const current = currentQuestions[questionIndex];

    const correct = areAnswersEquivalent(userAnswer, current.answer);

    const questionId = `Q${questionIndex + 1}`;

    const answerRef = doc(
      db,
      "StudentAnswerSheet",
      studentId,
      "Maths",
      "QuestionCategory",
      level,
      questionId
    );

    const badge = calculateQuestionBadge(secondsTaken, correct);

    await setDoc(
      answerRef,
      {
        question: current.question,
        answer: userAnswer,
        correctAnswer: current.answer,
        score: correct ? 1 : 0,
        scoreText: correct ? "Pass" : "Fail",
        badge: badge,
        latestSecondsTaken: secondsTaken,
        attemptDateTime: serverTimestamp(),
        isSubmit: isSubmit,
      },
      { merge: true }
    );
  }

  async function moveToNextQuestion(userAnswer: string) {
    if (savingRef.current || completed) return;

    savingRef.current = true;

    const index = currentQuestionRef.current;

    answersRef.current[index] = userAnswer;

    try {
      await saveAnswer(index, userAnswer, false, questionSeconds);

      if (index >= questionsRef.current.length - 1) {
        await finishQuiz();
        return;
      }

      const nextIndex = index + 1;

      currentQuestionRef.current = nextIndex;

      setCurrentQuestion(nextIndex);

      setAnswer("");

      setQuestionSeconds(0);
    } catch (error) {
      console.error("Error saving answer:", error);
    } finally {
      savingRef.current = false;
    }
  }

  async function startListening() {
    if (listening || completed) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    keepListeningRef.current = true;
    spokenAnswerRef.current = "";

    setListening(true);
    setAnswer("");

    recognition.onresult = (event: any) => {
      const result = event.results?.[0]?.[0];

      if (!result) {
        return;
      }

      const spokenText = result.transcript?.trim() || "";

      if (spokenText === "") {
        return;
      }

      spokenAnswerRef.current = spokenText;
      keepListeningRef.current = false;

      setAnswer(spokenText);

      recognition.stop();

      setTimeout(async () => {
        await moveToNextQuestion(spokenText);

        spokenAnswerRef.current = "";
        setListening(false);
      }, 700);
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }

      console.error("Speech recognition error:", event.error);

      if (event.error === "not-allowed") {
        keepListeningRef.current = false;
        setListening(false);
        alert("Microphone permission is blocked.");
        return;
      }

      if (event.error === "audio-capture") {
        keepListeningRef.current = false;
        setListening(false);
        alert("Microphone is not available.");
        return;
      }
    };

    recognition.onend = () => {
      if (keepListeningRef.current && !completed) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.log("Speech recognition restart:", error);
          }
        }, 300);

        return;
      }

      if (!spokenAnswerRef.current) {
        setListening(false);
      }
    };

    recognition.start();
  }

  async function finishQuiz() {
    if (completed) return;

    setCompleted(true);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const currentQuestions = questionsRef.current;

    let finalScore = 0;

    for (let i = 0; i < currentQuestions.length; i++) {
      const userAnswer = answersRef.current[i] || "";

      if (areAnswersEquivalent(userAnswer, currentQuestions[i].answer)) {
        finalScore++;
      }
    }

    setScore(finalScore);

    if (!studentId) {
      return;
    }

    try {
      const answersCollectionRef = collection(
        db,
        "StudentAnswerSheet",
        studentId,
        "Maths",
        "QuestionCategory",
        level
      );

      const answersSnapshot = await getDocs(answersCollectionRef);

      let savedTotalSeconds = 0;

      answersSnapshot.forEach((answerDoc) => {
        const data = answerDoc.data();

        savedTotalSeconds += Number(data.latestSecondsTaken ?? 0);
      });

      const averageSeconds =
        currentQuestions.length > 0
          ? Math.floor(savedTotalSeconds / currentQuestions.length)
          : 0;

      const wrongAnswers = currentQuestions.length - finalScore;

      let badge = "Good";

      if (wrongAnswers === 0) {
        if (averageSeconds <= 30) {
          badge = "Excellent";
        } else if (averageSeconds <= 60) {
          badge = "Very Good";
        }
      } else if (wrongAnswers <= 2) {
        badge = "Very Good";
      }

      const scoreRef = doc(
        db,
        "StudentScoreSheet",
        studentId,
        "Maths",
        "QuestionCategory",
        level,
        "scoreData"
      );

      await setDoc(
        scoreRef,
        {
          studentId: studentId,
          subject: "Maths",
          category: "QuestionCategory",
          level: level,
          score: finalScore,
          categoryName:
            titleFromUrl || currentQuestions[0]?.category || level,
          totalNoQuestions: currentQuestions.length,
          status: "Completed",
          latestBadge: badge,
          latestTotalSeconds: savedTotalSeconds,
          latestAverageSeconds: averageSeconds,
          latestAttemptStartTime: serverTimestamp(),
          latestAttemptEndTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Error saving score:", error);
    }
  }

  function formatTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  /* ---------------- UI ---------------- */

  if (loading) {
    return (
      <CenteredMessage>
        <CircularProgress size={24} color="inherit" />
        <Typography color="text.secondary">Loading...</Typography>
      </CenteredMessage>
    );
  }

  if (error) {
    return (
      <CenteredMessage>
        <Typography color="error">{error}</Typography>
      </CenteredMessage>
    );
  }

  if (!started) {
    return (
      <Box
        component="main"
        sx={{ minHeight: "100vh", bgcolor: "white", px: 2.5, py: 4 }}
      >
        <Container maxWidth="sm" disableGutters>
          <Typography
            variant="h4"
            sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: 4 }}
          >
            Instructions
          </Typography>

          <Paper
            elevation={1}
            sx={{ borderRadius: "24px", bgcolor: "grey.50", p: 3 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
              Enable 1 Minute Mode
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mb: 3.5,
              }}
            >
              <Typography color="text.secondary">
                Automatically save after 1 minute whether you answered all
                questions or not.
              </Typography>

              <Checkbox
                checked={oneMinuteMode}
                onChange={(e) => setOneMinuteMode(e.target.checked)}
                sx={{
                  color: "black",
                  "&.Mui-checked": { color: "black" },
                }}
              />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              General
            </Typography>

            <Box sx={{ mb: 3 }}>
              {generalPoints.map((point) => (
                <Typography
                  key={point}
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {point}
                </Typography>
              ))}
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
              Specifics
            </Typography>

            <Box sx={{ mb: 3 }}>
              {specificPoints.map((point) => (
                <Typography
                  key={point}
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {point}
                </Typography>
              ))}
            </Box>

            <Button
              fullWidth
              variant="contained"
              onClick={startQuiz}
              sx={{
                py: 2,
                borderRadius: "16px",
                bgcolor: "black",
                fontWeight: 700,
                textTransform: "none",
                fontSize: "1rem",
                "&:hover": { bgcolor: "grey.900" },
              }}
            >
              Start
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (completed) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          bgcolor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2.5,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: 448,
            borderRadius: "24px",
            p: 4,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2.5 }}>
            Quiz Completed!
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Your Score
          </Typography>

          <Typography variant="h2" sx={{ fontWeight: 700, mb: 4 }}>
            {score} / {questions.length}
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={() => router.push("/maths")}
            sx={{
              py: 2,
              borderRadius: "16px",
              bgcolor: "black",
              fontWeight: 700,
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": { bgcolor: "grey.900" },
            }}
          >
            Back to Home
          </Button>
        </Paper>
      </Box>
    );
  }

  const current = questions[currentQuestion];

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "white" }}>
      <Container maxWidth="md" sx={{ px: 2.5, py: 2.5 }}>
        {/* Top bar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 5,
          }}
        >
          <IconButton onClick={() => router.back()} aria-label="Back">
            <ArrowBackIcon fontSize="large" />
          </IconButton>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {titleFromUrl || current.category || "Addition"}
          </Typography>

          <Box sx={{ textAlign: "right" }}>
            {oneMinuteMode && (
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "error.main" }}
              >
                Quiz : {formatTime(quizSeconds)}
              </Typography>
            )}

            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {currentQuestion + 1}/{questions.length}
            </Typography>
          </Box>
        </Box>

        {/* Total timer */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              border: "2px solid black",
              borderRadius: "999px",
              px: 3,
              py: 1.5,
            }}
          >
            <TimerOutlinedIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatTime(totalSeconds)}
            </Typography>
          </Box>
        </Box>

        {/* Question */}
        <Paper
          elevation={6}
          sx={{
            borderRadius: "24px",
            p: 5,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            mb: 5,
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            {current.question}
          </Typography>
        </Paper>

        {/* Voice answer */}
        <Button
          fullWidth
          onClick={startListening}
          disabled={listening}
          sx={{
            bgcolor: "white",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "24px",
            p: 3,
            boxShadow: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textTransform: "none",
            "&:hover": { bgcolor: "grey.50" },
            "&.Mui-disabled": { bgcolor: "white", opacity: 0.9 },
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "text.secondary", textAlign: "left" }}
          >
            {answer
              ? answer
              : listening
              ? "Listening..."
              : "Tap microphone to speak your answer..."}
          </Typography>

          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#ffedd5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              ml: 2,
            }}
          >
            <MicIcon sx={{ fontSize: 32, color: "#f97316" }} />
          </Box>
        </Button>
      </Container>
    </Box>
  );
}