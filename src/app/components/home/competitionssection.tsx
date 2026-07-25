"use client";

import { Box, Container, Stack, Typography, Divider } from "@mui/material";
import MilitaryTechOutlinedIcon from "@mui/icons-material/MilitaryTechOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import GpsFixedOutlinedIcon from "@mui/icons-material/GpsFixedOutlined";

const items = [
  {
    icon: MilitaryTechOutlinedIcon,
    iconBg: "#E9F9EE",
    iconColor: "#19B44A",
    title: "Class Level Competition",
    description:
      "The students compete in the competitions held at their own class level within their own school.",
  },
  {
    icon: WorkspacePremiumOutlinedIcon,
    iconBg: "#E3F0FB",
    iconColor: "#2E7BD6",
    title: "Recognition & Certificates",
    description: "Top performers will receive certificates and recognition.",
  },
  {
    icon: GpsFixedOutlinedIcon,
    iconBg: "#F1E9FB",
    iconColor: "#8A4FD6",
    title: "Build Confidence",
    description:
      "Improve your skills and gain confidence in every challenge.",
  },
];

export default function CompetitionsSection() {
  return (
    <Box
      sx={{
        pt: { xs: 2, md: 3 },
        pb: { xs: 2, md: 5 },
        bgcolor: "#fff",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Box
          sx={{
            bgcolor: "#F4FAF9",
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
              Ramanujan Day – Annual Competitions
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", md: "1rem" },
                color: "#6B7280",
              }}
            >
              Class Level Competitions
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