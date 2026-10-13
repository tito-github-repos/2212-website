"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { auth, db } from "@/lib/firebase";

type ActivityRow = {
  levelId: string;
  categoryName: string;
  score: number;
  totalNoQuestions: number;
  seconds: number;
  date: Date | null;
};

type ActivityPageProps = {
  // When given, the back arrow calls this (e.g. to close a dialog)
  // instead of going back in browser history.
  onBack?: () => void;
};

function formatDate(date: Date | null) {
  if (!date) return { day: "-", time: "" };

  const month = date.toLocaleDateString("en-US", { month: "short" });
  const dayNumber = date.getDate();
  const year = String(date.getFullYear()).slice(-2);

  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { day: `${month} ${dayNumber}, ${year}`, time };
}

// Same logic as the quiz page: use the StudentRegister document id if the
// email matches, otherwise fall back to the Firebase uid.
async function getStudentId(uid: string, email: string | null) {
  if (!email) return uid;

  try {
    const snapshot = await getDocs(
      query(collection(db, "StudentRegister"), where("email", "==", email)),
    );

    if (snapshot.docs.length > 0) {
      return snapshot.docs[0].id;
    }
  } catch (error) {
    console.error("Error getting student:", error);
  }

  return uid;
}

async function fetchActivity(studentId: string): Promise<ActivityRow[]> {
  // 1. all categories (levels)
  const levelSnapshot = await getDocs(
    collection(db, "QuestionBank", "Maths", "QuestionCategory"),
  );

  // 2. this student's score for every level, in parallel
  const results = await Promise.all(
    levelSnapshot.docs.map(async (item) => {
      const categories = item.data().categories || [];
      const categoryName = categories.length > 0 ? categories[0] : item.id;

      try {
        const scoreSnap = await getDoc(
          doc(
            db,
            "StudentScoreSheet",
            studentId,
            "Maths",
            "QuestionCategory",
            item.id,
            "scoreData",
          ),
        );

        if (!scoreSnap.exists()) return null;

        const data = scoreSnap.data();
        if (data.status !== "Completed") return null;

        const row: ActivityRow = {
          levelId: item.id,
          categoryName: data.categoryName || categoryName,
          score: Number(data.score ?? 0),
          totalNoQuestions: Number(data.totalNoQuestions ?? 0),
          seconds: Number(data.latestTotalSeconds ?? 0),
          date:
            data.latestAttemptEndTime?.toDate?.() ??
            data.updatedAt?.toDate?.() ??
            null,
        };

        return row;
      } catch (error) {
        console.log("Error getting score:", error);
        return null;
      }
    }),
  );

  const list = results.filter((r): r is ActivityRow => r !== null);

  // latest attempt first
  list.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  return list;
}

export default function ActivityPage({ onBack }: ActivityPageProps) {
  const router = useRouter();

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  useEffect(() => {
    let cancelled = false;

    // wait for Firebase to restore the logged-in user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (!cancelled) {
          setLoggedIn(false);
          setLoading(false);
        }
        return;
      }

      try {
        const studentId = await getStudentId(user.uid, user.email);
        const list = await fetchActivity(studentId);

        if (!cancelled) {
          setLoggedIn(true);
          setRows(list);
        }
      } catch (error) {
        console.log("Error getting activity:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (loading) {
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
        <CircularProgress size={24} color="inherit" />
        <Typography sx={{ fontWeight: 700, color: "grey.600" }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "white",
        px: { xs: 1.5, sm: 2.5, md: 4 },
        py: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 720, md: 900, lg: 1000 },
          mx: "auto",
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 3,
          }}
        >
          <IconButton
            onClick={handleBack}
            aria-label="Back"
            sx={{ position: "absolute", left: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="h5"
            sx={{ fontWeight: 900, fontSize: { xs: "1.25rem", md: "1.75rem" } }}
          >
            Activity
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{ borderRadius: "16px" }}
        >
          <Table
            sx={{
              tableLayout: "fixed",
              "& .MuiTableCell-root": {
                px: { xs: 1, sm: 2, md: 3 },
                py: { xs: 1.5, md: 2.5 },
                fontSize: { xs: "0.75rem", sm: "0.9rem", md: "1.05rem" },
                wordBreak: "break-word",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, width: "34%" }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 800, width: "28%" }}>
                  Date & Time
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "20%" }}
                >
                  Time (Sec)
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ fontWeight: 800, width: "18%" }}
                >
                  Score
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{ py: 5, color: "text.secondary", border: 0 }}
                  >
                    {loggedIn
                      ? "No activity yet"
                      : "Please login to see your activity"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const { day, time } = formatDate(row.date);

                  return (
                    <TableRow
                      key={row.levelId}
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell sx={{ fontWeight: 800 }}>
                        {row.categoryName}
                      </TableCell>

                      <TableCell>
                        <Typography
                          sx={{ fontWeight: 800, fontSize: "inherit" }}
                        >
                          {day}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          sx={{ fontSize: "0.85em" }}
                        >
                          {time}
                        </Typography>
                      </TableCell>

                      <TableCell align="center" sx={{ fontWeight: 800 }}>
                        {row.seconds}
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {row.score}/{row.totalNoQuestions}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}