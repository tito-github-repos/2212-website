"use client";

import { Box, Container, Stack, Typography, Divider } from "@mui/material";
import PsychologyAltOutlinedIcon from "@mui/icons-material/PsychologyAltOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

const items = [
  {
    icon: PsychologyAltOutlinedIcon,
    iconBg: "#FCE9EA",
    iconColor: "#E05265",
    title: "Improve Focus",
    description: "Stay focused and solve better.",
  },
  {
    icon: BoltOutlinedIcon,
    iconBg: "#FDF3DC",
    iconColor: "#E8A800",
    title: "Enhance Memory",
    description: "Remember more, forget less.",
  },
  {
    icon: TrendingUpOutlinedIcon,
    iconBg: "#E3F0FB",
    iconColor: "#2E7BD6",
    title: "Solve Faster",
    description: "Practice daily and improve speed.",
  },
];

export default function DailyPracticeSection() {
  return (
    <Box
      sx={{
        pt: { xs: 1, md: 2 },
        pb: { xs: 2, md: 5 },
        bgcolor: "#fff",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            bgcolor: "#fcf8f2",
            borderRadius: { xs: 3, md: 4 },
            px: { xs: 3, sm: 5, md: 6 },
            py: { xs: 4, md: 5 },
          }}
        >
          <Stack spacing={0.75} sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#111",
                fontSize: { xs: "1.4rem", sm: "1.7rem", md: "2rem" },
              }}
            >
              Daily Maths Practice for Students
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", md: "1rem" },
                color: "#6B7280",
              }}
            >
              Strengthen your mind every day!
            </Typography>
          </Stack>

          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              border: "1px solid #ECECEC",
              p: { xs: 3, md: 4 },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              divider={
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{ display: { xs: "none", md: "block" } }}
                />
              }
              spacing={{ xs: 3, md: 4 }}
            >
              {items.map(({ icon: Icon, iconBg, iconColor, title, description }) => (
                <Stack
                  key={title}
                  direction="row"
                  spacing={2}
                  sx={{ flex: 1 }}
                >
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      minWidth: 56,
                      borderRadius: "50%",
                      bgcolor: iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon sx={{ color: iconColor, fontSize: 28 }} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "0.95rem", md: "1rem" },
                        color: "#111",
                        mb: 0.5,
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.8rem", md: "0.85rem" },
                        color: "#6B7280",
                        lineHeight: 1.5,
                      }}
                    >
                      {description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}