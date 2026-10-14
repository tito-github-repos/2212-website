//src\app\maths\page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import PracticeDrawer from "../practice/PracticeDrawer";
import {
  fetchScoreData,
  getAvailableLevelsWithCategories,
  getStudent,
  type LevelInfo,
  type ScoreData,
} from "../../lib/questionService";
import { getBadgeIcon, getResultInfo } from "../../lib/quizRules";

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

function InfoCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <Paper sx={{ mt: 2, p: 2.5, borderRadius: "22px" }} elevation={0}>
      <Typography variant="h6" sx={{ fontWeight: 900 }} color="text.primary">
        {title}
      </Typography>

      <Stack spacing={1} sx={{ mt: 1.5 }}>
        {lines.map((line) => (
          <Typography
            key={line}
            variant="body2"
            sx={{ fontWeight: 600 }}
            color="text.secondary"
          >
            • {line}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}

export default function MathsPage() {
  const router = useRouter();

  const [levels, setLevels] = useState<LevelInfo[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    getLevels();
  }, []);

  const getLevels = async () => {
    try {
      const levelList = await getAvailableLevelsWithCategories(SUBJECT);

      setLevels(levelList);

      await getScores(levelList);
    } catch (error) {
      console.log("Error getting levels:", error);
    } finally {
      setLoading(false);
    }
  };

  // uses the same student id as the mobile app, so scores from both apps show up here
  const getScores = async (levelList: LevelInfo[]) => {
    const student = await getStudent();

    if (student.isGuest || !student.id) {
      return;
    }

    const results = await Promise.all(
      levelList.map(async (level) => {
        try {
          const data = await fetchScoreData(student.id, SUBJECT, level.levelId);
          return { levelId: level.levelId, data };
        } catch (error) {
          console.log("Error getting score:", error);
          return { levelId: level.levelId, data: null };
        }
      }),
    );

    const scoreList: Record<string, ScoreData> = {};

    for (const item of results) {
      if (item.data) {
        scoreList[item.levelId] = item.data;
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
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={28} sx={{ color: "#000" }} />
        <Typography color="text.secondary" sx={{ fontWeight: 700 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ minHeight: "100vh", bgcolor: "grey.100", color: "text.primary" }}
    >
      {/* Header */}
      <Box
        sx={{
          bgcolor: "#000",
          color: "#fff",
          px: 2.5,
          pt: 4,
          pb: 3,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
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
            aria-label="Open Menu"
            onClick={() => setDrawerOpen(true)}
            sx={{
              position: "absolute",
              left: 0,
              bgcolor: "#fff",
              color: "#000",
              width: 48,
              height: 48,
              borderRadius: 3,
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
          <InfoCard title="General" lines={GENERAL_LINES} />
          <InfoCard title="Specifics" lines={SPECIFIC_LINES} />
        </Box>
      </Box>

      {/* Test cards */}
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

            // a saved score means the test was completed before
            // (older "InProgress" documents still keep the last completed score)
            const total = Number(scoreData?.totalNoQuestions ?? 0);
            const completed = total > 0;

            // score chip: result icon (or badge icon) + score, red when the test must be repeated
            const score = Number(scoreData?.score ?? 0);
            const info = getResultInfo(score, total);
            const badge =
              info.status === "repeat"
                ? ""
                : String(scoreData?.latestBadge ?? "");
            const chipIcon = badge ? getBadgeIcon(badge) : info.icon;

            const isMultiplication =
              level.categoryName.startsWith("Multiplication");

            const secondLine = isMultiplication
              ? level.categoryName.replace("Multiplication", "").trim()
              : "";

            return (
              <Card
                key={level.levelId}
                elevation={3}
                sx={{ borderRadius: "22px", border: "2px solid #000" }}
              >
                <CardActionArea
                  onClick={() => openTest(level.levelId, level.categoryName)}
                  sx={{
                    minHeight: 220,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
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
                      <Chip
                        label={`${chipIcon} ${score} / ${total}`}
                        color={info.status === "repeat" ? "error" : "success"}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 2, fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </Box>

      <PracticeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </Box>
  );
}