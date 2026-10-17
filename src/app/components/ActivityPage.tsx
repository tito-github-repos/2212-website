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
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import LanguageIcon from "@mui/icons-material/Language";
import MicIcon from "@mui/icons-material/Mic";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import { auth, db } from "@/lib/firebase";

/* dark theme colours (same values as globals.css) */
const BG = "#000";
const CARD = "#141414";
const CARD_SOFT = "#1f1f1f";
const BORDER = "rgba(255,255,255,0.15)";
const TEXT = "#fff";
const TEXT_SOFT = "rgba(255,255,255,0.8)";

const HISTORY_PAGE_SIZE = 5;

type AttemptHistoryItem = {
  attemptNo: number;
  score: number;
  totalNoQuestions: number;
  totalSeconds: number;
  date: Date | null;
  answerMode: AnswerMode;
  testMode: TestMode;
  platform: string; // "web", "mobile" or "unknown"
};

type ActivityRow = {
  levelId: string;
  categoryName: string;
  score: number;
  totalNoQuestions: number;
  seconds: number;
  date: Date | null;
  attemptNo: number;
  answerMode: AnswerMode;
  testMode: TestMode;
  platform: string;
  history: AttemptHistoryItem[];
};

type AnswerMode = "voice" | "keyboard";

type TestMode = "ownPace" | "twoMinute" | "oneMinute";

// older attempts have no test mode saved, they were all own pace
function toTestMode(value: unknown): TestMode {
  return value === "twoMinute" || value === "oneMinute" ? value : "ownPace";
}

const TEST_MODE_LABEL: Record<TestMode, string> = {
  ownPace: "Own pace",
  twoMinute: "2 min",
  oneMinute: "1 min",
};

// own pace / 2 minute / 1 minute - its own column
function TestModeCell({ testMode }: { testMode: TestMode }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
      {testMode !== "ownPace" && <TimerOutlinedIcon fontSize="small" />}
      <Typography sx={{ fontSize: "0.85em", color: TEXT_SOFT, whiteSpace: "nowrap", wordBreak: "normal" }}>
        {TEST_MODE_LABEL[testMode]}
      </Typography>
    </Box>
  );
}

// how the test was answered - its own column
function AnswerModeCell({ answerMode }: { answerMode: AnswerMode }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
      <Tooltip title={answerMode === "keyboard" ? "Keyboard" : "Voice"}>
        {answerMode === "keyboard" ? (
          <KeyboardIcon fontSize="small" />
        ) : (
          <MicIcon fontSize="small" />
        )}
      </Tooltip>
      <Typography sx={{ fontSize: "0.85em", color: TEXT_SOFT, whiteSpace: "nowrap", wordBreak: "normal" }}>
        {answerMode === "keyboard" ? "Keyboard" : "Voice"}
      </Typography>
    </Box>
  );
}

// which app it was taken on - its own column
function PlatformCell({ platform }: { platform: string }) {
  const isWeb = platform === "web";
  const isMobile =
    platform === "mobile" || platform === "android" || platform === "ios";

  if (!isWeb && !isMobile) {
    return (
      <Tooltip title="Device not recorded">
        <Typography component="span" sx={{ color: TEXT_SOFT }}>
          -
        </Typography>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
      <Tooltip title={isWeb ? "Web" : "Mobile app"}>
        {isWeb ? (
          <LanguageIcon fontSize="small" />
        ) : (
          <PhoneAndroidIcon fontSize="small" />
        )}
      </Tooltip>
      <Typography sx={{ fontSize: "0.85em", color: TEXT_SOFT, whiteSpace: "nowrap", wordBreak: "normal" }}>
        {isWeb ? "Web" : "Mobile"}
      </Typography>
    </Box>
  );
}

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

// every earlier completed attempt for one level, newest first
async function fetchAttemptHistory(
  studentId: string,
  level: string,
): Promise<AttemptHistoryItem[]> {
  try {
    const snapshot = await getDocs(
      collection(
        db,
        "StudentScoreSheet",
        studentId,
        "Maths",
        "QuestionCategory",
        level,
        "scoreData",
        "attemptHistory",
      ),
    );

    const items: AttemptHistoryItem[] = snapshot.docs.map((historyDoc) => {
      const data = historyDoc.data();
      return {
        attemptNo: Number(data.attemptNo ?? 0),
        score: Number(data.score ?? 0),
        totalNoQuestions: Number(data.totalNoQuestions ?? 0),
        totalSeconds: Number(data.totalSeconds ?? 0),
        date: data.attemptEndTime?.toDate?.() ?? null,
        // older attempts have no mode saved, they were all taken by voice
        answerMode: data.answerMode === "keyboard" ? "keyboard" : "voice",
        testMode: toTestMode(data.testMode),
        platform: String(data.platform ?? "unknown"),
      };
    });

    items.sort((a, b) => b.attemptNo - a.attemptNo);

    return items;
  } catch (error) {
    console.log("Error getting attempt history:", error);
    return [];
  }
}

async function fetchActivity(studentId: string): Promise<ActivityRow[]> {
  // 1. all categories (levels)
  const levelSnapshot = await getDocs(
    collection(db, "QuestionBank", "Maths", "QuestionCategory"),
  );

  // 2. this student's score (+ attempt history) for every level, in parallel
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

        const history = await fetchAttemptHistory(studentId, item.id);

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
          attemptNo: Number(data.latestAttemptNo ?? 1),
          answerMode: data.latestAnswerMode === "keyboard" ? "keyboard" : "voice",
          testMode: toTestMode(data.latestTestMode),
          platform: String(data.latestPlatform ?? "unknown"),
          history,
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

/* ---------- History modal (5 rows per page + pagination) ---------- */

function HistoryDialog({
  row,
  onClose,
}: {
  row: ActivityRow | null;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const [prevLevelId, setPrevLevelId] = useState(row?.levelId);

  // always start from the first page when a different row is opened
  // (state is adjusted during render, so no effect is needed)
  if (row?.levelId !== prevLevelId) {
    setPrevLevelId(row?.levelId);
    setPage(0);
  }

  const history = row?.history ?? [];
  const pageItems = history.slice(
    page * HISTORY_PAGE_SIZE,
    page * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE,
  );

  const headCellSx = {
    color: TEXT_SOFT,
    fontWeight: 700,
    borderBottom: `1px solid ${BORDER}`,
  };

  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            bgcolor: CARD,
            backgroundImage: "none",
            color: TEXT,
            border: `1px solid ${BORDER}`,
            borderRadius: "16px",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontWeight: 900,
          pr: 1,
        }}
      >
        <Box component="span">
          History
          {row && (
            <Typography
              component="span"
              sx={{ ml: 1, fontSize: "0.9rem", color: TEXT_SOFT }}
            >
              {row.categoryName}
            </Typography>
          )}
        </Box>

        <IconButton onClick={onClose} aria-label="Close" sx={{ color: TEXT }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1, sm: 2 }, pb: 2 }}>
        <TableContainer
          sx={{ bgcolor: CARD_SOFT, borderRadius: "12px", overflowX: "auto" }}
        >
          <Table
            size="small"
            sx={{
              tableLayout: "fixed",
              minWidth: 820,
              "& .MuiTableCell-root": {
                color: TEXT,
                borderBottom: `1px solid ${BORDER}`,
                py: 1.5,
                px: 1,
              },
              "& tbody tr:last-of-type .MuiTableCell-root": { border: 0 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headCellSx, width: "9%" }}>Attempt</TableCell>
                <TableCell sx={{ ...headCellSx, width: "20%" }}>
                  Date & Time
                </TableCell>
                <TableCell align="center" sx={{ ...headCellSx, width: "11%" }}>
                  Time (Sec)
                </TableCell>
                <TableCell align="center" sx={{ ...headCellSx, width: "14%" }}>
                  Test Mode
                </TableCell>
                <TableCell align="center" sx={{ ...headCellSx, width: "15%" }}>
                  Answer Mode
                </TableCell>
                <TableCell align="center" sx={{ ...headCellSx, width: "15%" }}>
                  Platform
                </TableCell>
                <TableCell align="right" sx={{ ...headCellSx, width: "16%" }}>
                  Score
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{ py: 4, color: TEXT_SOFT }}
                  >
                    No previous attempts
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((attempt, index) => {
                  const { day, time } = formatDate(attempt.date);
                  return (
                    <TableRow key={`${attempt.attemptNo}-${index}`}>
                      <TableCell sx={{ fontWeight: 800 }}>
                        {attempt.attemptNo}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: "inherit" }}>
                          {day}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.85em", color: TEXT_SOFT }}
                        >
                          {time}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">{attempt.totalSeconds}</TableCell>
                      <TableCell align="center">
                        <TestModeCell testMode={attempt.testMode} />
                      </TableCell>
                      <TableCell align="center">
                        <AnswerModeCell answerMode={attempt.answerMode} />
                      </TableCell>
                      <TableCell align="center">
                        <PlatformCell platform={attempt.platform} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        {attempt.score}/{attempt.totalNoQuestions}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {history.length > HISTORY_PAGE_SIZE && (
          <TablePagination
            component="div"
            count={history.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={HISTORY_PAGE_SIZE}
            rowsPerPageOptions={[]}
            sx={{
              color: TEXT_SOFT,
              borderBottom: 0,
              "& .MuiTablePagination-actions .MuiIconButton-root": {
                color: TEXT,
              },
              "& .MuiTablePagination-actions .Mui-disabled": {
                color: "rgba(255,255,255,0.3)",
              },
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Main table row ---------- */

function ActivityRowItem({
  row,
  onOpenHistory,
}: {
  row: ActivityRow;
  onOpenHistory: (row: ActivityRow) => void;
}) {
  const { day, time } = formatDate(row.date);
  const hasHistory = row.history.length > 0;

  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 800 }}>{row.categoryName}</TableCell>

      <TableCell>
        <Typography sx={{ fontWeight: 800, fontSize: "inherit", color: TEXT }}>
          {day}
        </Typography>
        <Typography sx={{ fontSize: "0.85em", color: TEXT_SOFT }}>
          {time}
        </Typography>
      </TableCell>

      <TableCell align="center" sx={{ fontWeight: 800 }}>
        {row.seconds}
      </TableCell>

      <TableCell align="center" sx={{ fontWeight: 800 }}>
        {row.score}/{row.totalNoQuestions}
      </TableCell>

      <TableCell align="center">
        <TestModeCell testMode={row.testMode} />
      </TableCell>

      <TableCell align="center">
        <AnswerModeCell answerMode={row.answerMode} />
      </TableCell>

      <TableCell align="center">
        <PlatformCell platform={row.platform} />
      </TableCell>

      <TableCell align="center">
        {hasHistory ? (
          <Tooltip title="View previous attempts">
            <IconButton
              size="small"
              onClick={() => onOpenHistory(row)}
              aria-label="Show attempt history"
              sx={{ color: TEXT }}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Typography sx={{ color: TEXT_SOFT }}>-</Typography>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function ActivityPage({ onBack }: ActivityPageProps) {
  const router = useRouter();

  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(true);
  const [historyRow, setHistoryRow] = useState<ActivityRow | null>(null);

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
          bgcolor: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={24} sx={{ color: TEXT }} />
        <Typography sx={{ fontWeight: 700, color: TEXT_SOFT }}>
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
        bgcolor: BG,
        color: TEXT,
        px: { xs: 1.5, sm: 2.5, md: 4 },
        py: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 760, md: 1040, lg: 1240 },
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
            sx={{ position: "absolute", left: 0, color: TEXT }}
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: TEXT,
              fontSize: { xs: "1.25rem", md: "1.75rem" },
            }}
          >
            Activity
          </Typography>
        </Box>

        {/* Table */}
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            borderRadius: "16px",
            bgcolor: CARD,
            backgroundImage: "none",
            color: TEXT,
            border: `1px solid ${BORDER}`,
            overflowX: "auto",
          }}
        >
          <Table
            sx={{
              tableLayout: "fixed",
              minWidth: 1040,
              "& .MuiTableCell-root": {
                px: { xs: 1, sm: 1.5, md: 2 },
                py: { xs: 1.5, md: 2.5 },
                fontSize: { xs: "0.75rem", sm: "0.9rem", md: "1.05rem" },
                wordBreak: "break-word",
                color: TEXT,
                borderBottom: `1px solid ${BORDER}`,
              },
            }}
          >
            <TableHead>
              <TableRow sx={{ bgcolor: CARD_SOFT }}>
                <TableCell sx={{ fontWeight: 800, width: "14%" }}>
                  Category
                </TableCell>
                <TableCell sx={{ fontWeight: 800, width: "14%" }}>
                  Date & Time
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "10%" }}
                >
                  Time (Sec)
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "9%" }}
                >
                  Score
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "12%" }}
                >
                  Test Mode
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "15%" }}
                >
                  Answer Mode
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "14%" }}
                >
                  Platform
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: 800, width: "12%" }}
                >
                  History
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 5, color: TEXT_SOFT, border: 0 }}
                  >
                    {loggedIn
                      ? "No activity yet"
                      : "Please login to see your activity"}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <ActivityRowItem
                    key={row.levelId}
                    row={row}
                    onOpenHistory={setHistoryRow}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <HistoryDialog row={historyRow} onClose={() => setHistoryRow(null)} />
    </Box>
  );
}