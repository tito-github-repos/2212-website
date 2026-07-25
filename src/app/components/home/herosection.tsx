"use client";

import Image from "next/image";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PsychologyAltOutlinedIcon from "@mui/icons-material/PsychologyAltOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";

const features = [
  { icon: TrackChangesOutlinedIcon, line1: "Improve", line2: "Focus" },
  { icon: PsychologyAltOutlinedIcon, line1: "Stronger", line2: "Memory" },
  { icon: BoltOutlinedIcon, line1: "Think", line2: "Faster" },
  { icon: EmojiEventsOutlinedIcon, line1: "Excel in", line2: "Competitions" },
];

export default function HeroSection() {
  return (
    <Box
      sx={{
        pt: { xs: 4, md: 6 },
        pb: { xs: 2, md: 3 },
        bgcolor: "#fff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid
          container
          spacing={{ xs: 6, md: 5 }}
          sx={{ alignItems: "center" }}
        >
          {/* ================= LEFT CONTENT ================= */}

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack
              spacing={{ xs: 3, md: 4 }}
              sx={{
                width: "100%",
                alignItems: { xs: "center", sm: "center", md: "flex-start" },
                textAlign: { xs: "center", sm: "center", md: "left" },
              }}
            >
              <Chip
                icon={<AutoAwesomeIcon />}
                label="Sharpen Your Mind. Achieve Your Best."
                sx={{
                  bgcolor: "#E9F9EE",
                  color: "#17A34A",
                  fontWeight: 600,
                  px: 1,
                  width: "fit-content",
                }}
              />

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  lineHeight: 1.2,
                  color: "#111",
                  fontSize: {
                    xs: "1.8rem",
                    sm: "2.2rem",
                    md: "2.6rem",
                    lg: "3rem",
                  },
                }}
              >
                Where The Focus
                <br />
                Goes,{" "}
                <Box
                  component="span"
                  sx={{
                    color: "#19B44A",
                  }}
                >
                  Energy Flows.
                </Box>
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  maxWidth: 480,
                  lineHeight: 1.7,
                  mx: { xs: "auto", md: 0 },
                  fontSize: {
                    xs: "0.9rem",
                    md: "1rem",
                  },
                }}
              >
                Mental Calisthenics for a sharper mind, stronger memory and a
                brighter future through engaging activities and structured
                learning.
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={4}
                sx={{ width: { xs: "100%", sm: "auto" }, alignItems: "center" }}
              >
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<EditOutlinedIcon />}
                  onClick={() => {
                    document
                      .getElementById("premium-resources")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                  }}
                  sx={{
                    bgcolor: "#19B44A",
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": {
                      bgcolor: "#12953c",
                    },
                  }}
                >
                  Start Learning
                </Button>

                <Button
                  variant="outlined"
                  size="medium"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={() => {
                    document.getElementById("app-download")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "#19B44A",
                    color: "#19B44A",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    width: { xs: "100%", sm: "auto" },
                    "&:hover": {
                      borderColor: "#19B44A",
                      bgcolor: "#F5FFF8",
                    },
                  }}
                >
                  Download App
                </Button>
              </Stack>

              {/* Features */}
              <Grid
                container
                spacing={{ xs: 2, md: 3 }}
                sx={{
                  width: "100%",
                  mt: { xs: 1, md: 2 },
                  justifyContent: {
                    xs: "center",
                    sm: "center",
                    md: "flex-start",
                  },
                }}
              >
                {features.map(({ icon: Icon, line1, line2 }) => (
                  <Grid
                    key={line1 + line2}
                    size={{ xs: 6, sm: 3, md: 3 }}
                    sx={{ minWidth: 0 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{
                        alignItems: "center",
                        justifyContent: {
                          xs: "center",
                          sm: "center",
                          md: "flex-start",
                        },
                      }}
                    >
                      <Icon
                        sx={{
                          color: "#19B44A",
                          fontSize: { xs: 32, sm: 26, md: 32 },
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1.3,
                          textAlign: "left",
                          whiteSpace: "nowrap",
                          fontSize: {
                            xs: "0.875rem",
                            sm: "0.75rem",
                            md: "0.875rem",
                          },
                        }}
                      >
                        {line1}
                        <br />
                        {line2}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>
          {/* close LEFT content Grid item */}

          {/* ================= RIGHT CONTENT ================= */}

          <Grid size={{ xs: 12, md: 5 }}>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: { xs: 220, sm: 280, md: 380, lg: 400 },
              }}
            >
              {/* Student Image */}

              <Image
                src="/img/home/hero-img1.jpg"
                alt="Hero Student"
                width={800}
                height={600}
                priority
                style={{
                  width: "100%",
                  maxWidth: "520px",
                  height: "auto",
                  position: "relative",
                  zIndex: 2,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
