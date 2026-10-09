// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { db, auth } from "@/lib/firebase";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
// } from "firebase/firestore";

// type Level = {
//   levelId: string;
//   categoryName: string;
// };

// type ScoreData = {
//   score?: number;
//   totalNoQuestions?: number;
//   status?: string;
// };

// export default function MathsPage() {
//   const router = useRouter();

//   const [levels, setLevels] = useState<Level[]>([]);
//   const [scores, setScores] = useState<Record<string, ScoreData>>({});
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     getLevels();
//   }, []);

//   const getLevels = async () => {
//     try {
//       const levelRef = collection(
//         db,
//         "QuestionBank",
//         "Maths",
//         "QuestionCategory"
//       );

//       const snapshot = await getDocs(levelRef);

//       const levelList: Level[] = [];

//       snapshot.forEach((item) => {
//         const data = item.data();

//         const categories = data.categories || [];

//         levelList.push({
//           levelId: item.id,
//           categoryName:
//             categories.length > 0 ? categories[0] : item.id,
//         });
//       });

//       levelList.sort((a, b) => {
//         const numberA =
//           parseInt(a.levelId.replace(/\D/g, "")) || 0;

//         const numberB =
//           parseInt(b.levelId.replace(/\D/g, "")) || 0;

//         return numberA - numberB;
//       });

//       setLevels(levelList);

//       await getScores(levelList);
//     } catch (error) {
//       console.log("Error getting levels:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getScores = async (levelList: Level[]) => {
//     const user = auth.currentUser;

//     if (!user) {
//       return;
//     }

//     const scoreList: Record<string, ScoreData> = {};

//     for (const level of levelList) {
//       try {
//         const scoreRef = doc(
//           db,
//           "StudentScoreSheet",
//           user.uid,
//           "Maths",
//           "QuestionCategory",
//           level.levelId,
//           "scoreData"
//         );

//         const scoreSnapshot = await getDoc(scoreRef);

//         if (scoreSnapshot.exists()) {
//           scoreList[level.levelId] =
//             scoreSnapshot.data() as ScoreData;
//         }
//       } catch (error) {
//         console.log("Error getting score:", error);
//       }
//     }

//     setScores(scoreList);
//   };

//   const openTest = (levelId: string, categoryName: string) => {
//     router.push(
//       `/maths/${levelId}?title=${encodeURIComponent(categoryName)}`
//     );
//   };

//   if (loading) {
//     return (
//       <main className="min-h-screen bg-gray-100 flex items-center justify-center">
//         <p className="font-bold text-gray-600">
//           Loading...
//         </p>
//       </main>
//     );
//   }

//   return (
//     <main className="min-h-screen bg-gray-100">

//       {/* Header */}

//       <div className="bg-black text-white px-5 pt-8 pb-6 rounded-b-[28px]">

//         <div className="flex items-center justify-center relative">

//           <button className="absolute left-0 bg-white text-black w-12 h-12 rounded-xl text-2xl">
//             ☰
//           </button>

//           <h1 className="text-3xl font-black">
//             2212
//           </h1>

//         </div>

//         {/* General */}

//         <div className="mt-8 bg-white rounded-[22px] p-5 text-gray-500">

//           <h2 className="text-xl font-black text-gray-800">
//             General
//           </h2>

//           <div className="mt-3 space-y-2 text-sm font-semibold">

//             <p>
//               • There are ten tests here. Each test has 60 numerical.
//             </p>

//             <p>
//               • You need to solve each test by less than a minute.
//             </p>

//             <p>
//               • The goal is to solve within 30 seconds.
//             </p>

//             <p>
//               • Excellent: Solving it by less than 30 seconds.
//             </p>

//             <p>
//               • Very Good: Solving it by less than 60 seconds.
//             </p>

//             <p>
//               • Good: Solving it by less than 120 seconds.
//             </p>

//           </div>

//         </div>

//         {/* Specifics */}

//         <div className="mt-4 bg-white rounded-[22px] p-5 text-gray-500">

//           <h2 className="text-xl font-black text-gray-800">
//             Specifics
//           </h2>

//           <div className="mt-3 space-y-2 text-sm font-semibold">

//             <p>
//               • Getting full score of 60 out of 60 is our target.
//             </p>

//             <p>
//               • If you are getting a score of 59/58 is ok.
//             </p>

//             <p>
//               • If you are getting 57 and less than that, you can repeat the test.
//             </p>

//           </div>

//         </div>

//       </div>

//       {/* Test Cards */}

//       <div className="px-5 py-6">

//         <div className="grid grid-cols-2 gap-3">

//           {levels.map((level) => {

//             const scoreData = scores[level.levelId];

//             const completed =
//               scoreData?.status === "Completed";

//             let title = level.categoryName;

//             let secondLine = "";

//             if (level.categoryName.startsWith("Multiplication")) {
//               title = "Multiplication";
//               secondLine =
//                 level.categoryName
//                   .replace("Multiplication", "")
//                   .trim();
//             }

//             return (
//               <button
//                 key={level.levelId}
//                 onClick={() =>
//                   openTest(
//                     level.levelId,
//                     level.categoryName
//                   )
//                 }
//                 className="bg-white min-h-[220px] rounded-[22px] border-2 border-black shadow-md flex items-center justify-center p-4"
//               >

//                 <div className="text-center">

//                   {level.categoryName.startsWith("Multiplication") ? (
//                     <>
//                       <h2 className="text-xl font-black text-gray-900">
//                         {title}
//                       </h2>

//                       <p className="text-lg font-black text-gray-900 mt-1">
//                         {secondLine}
//                       </p>
//                     </>
//                   ) : (
//                     <h2 className="text-xl font-black text-gray-900">
//                       {level.categoryName}
//                     </h2>
//                   )}

//                   {completed && (
//                     <p className="text-sm text-gray-500 mt-3">
//                       {scoreData?.score} /{" "}
//                       {scoreData?.totalNoQuestions}
//                     </p>
//                   )}

//                 </div>

//               </button>
//             );
//           })}

//         </div>

//       </div>

//     </main>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

type Level = {
  levelId: string;
  categoryName: string;
};

type ScoreData = {
  score?: number;
  totalNoQuestions?: number;
  status?: string;
};

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

function InfoCard({ title, points }: { title: string; points: string[] }) {
  return (
    <Paper
      elevation={0}
      sx={{ mt: 2, borderRadius: "22px", p: 2.5, color: "grey.600" }}
    >
      <Typography variant="h6" sx={{ fontWeight: 900 }} color="grey.800">
        {title}
      </Typography>

      <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        {points.map((point) => (
          <Typography key={point} variant="body2" sx={{ fontWeight: 600 }}>
            • {point}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
}

export default function MathsPage() {
  const router = useRouter();

  const [levels, setLevels] = useState<Level[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLevels();
  }, []);

  const getLevels = async () => {
    try {
      const levelRef = collection(
        db,
        "QuestionBank",
        "Maths",
        "QuestionCategory",
      );

      const snapshot = await getDocs(levelRef);
      const levelList: Level[] = [];

      snapshot.forEach((item) => {
        const data = item.data();
        const categories = data.categories || [];

        levelList.push({
          levelId: item.id,
          categoryName: categories.length > 0 ? categories[0] : item.id,
        });
      });

      levelList.sort((a, b) => {
        const numberA = parseInt(a.levelId.replace(/\D/g, "")) || 0;
        const numberB = parseInt(b.levelId.replace(/\D/g, "")) || 0;
        return numberA - numberB;
      });

      setLevels(levelList);
      await getScores(levelList);
    } catch (error) {
      console.log("Error getting levels:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScores = async (levelList: Level[]) => {
    const user = auth.currentUser;
    if (!user) return;

    const scoreList: Record<string, ScoreData> = {};

    for (const level of levelList) {
      try {
        const scoreRef = doc(
          db,
          "StudentScoreSheet",
          user.uid,
          "Maths",
          "QuestionCategory",
          level.levelId,
          "scoreData",
        );

        const scoreSnapshot = await getDoc(scoreRef);

        if (scoreSnapshot.exists()) {
          scoreList[level.levelId] = scoreSnapshot.data() as ScoreData;
        }
      } catch (error) {
        console.log("Error getting score:", error);
      }
    }

    setScores(scoreList);
  };

  const openTest = (levelId: string, categoryName: string) => {
    router.push(`/maths/${levelId}?title=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return (
      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={24} color="inherit" />
        <Typography sx={{ fontWeight: 700, color: "grey.600" }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", bgcolor: "grey.100" }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "black",
          color: "white",
          px: 2.5,
          pt: 4,
          pb: 3,
          borderRadius: "0 0 28px 28px",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              left: 0,
              bgcolor: "white",
              color: "black",
              width: 48,
              height: 48,
              borderRadius: "12px",
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            2212
          </Typography>
        </Box>

        <Box sx={{ mt: 2 }}>
          <InfoCard title="General" points={generalPoints} />
          <InfoCard title="Specifics" points={specificPoints} />
        </Box>
      </Box>

      {/* Test Cards */}
      <Box sx={{ px: 2.5, py: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1.5,
          }}
        >
          {levels.map((level) => {
            const scoreData = scores[level.levelId];
            const completed = scoreData?.status === "Completed";
            const isMultiplication =
              level.categoryName.startsWith("Multiplication");

            const secondLine = isMultiplication
              ? level.categoryName.replace("Multiplication", "").trim()
              : "";

            return (
              <Button
                key={level.levelId}
                onClick={() => openTest(level.levelId, level.categoryName)}
                sx={{
                  bgcolor: "white",
                  minHeight: 220,
                  borderRadius: "22px",
                  border: "2px solid black",
                  boxShadow: 2,
                  p: 2,
                  color: "grey.900",
                  textTransform: "none",
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  {isMultiplication ? (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        Multiplication
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 900, mt: 0.5 }}
                      >
                        {secondLine}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {level.categoryName}
                    </Typography>
                  )}

                  {completed && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1.5 }}
                    >
                      {scoreData?.score} / {scoreData?.totalNoQuestions}
                    </Typography>
                  )}
                </Box>
              </Button>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
