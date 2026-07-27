"use client";

import Image from "next/image";
import { Box, Container, Grid, Stack, Typography } from "@mui/material";
import RepeatRoundedIcon from "@mui/icons-material/RepeatRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";

const features = [
  {
    icon: RepeatRoundedIcon,
    text: "Practice unlimited times until you master every topic",
  },
  {
    icon: EmojiEventsRoundedIcon,
    text: "Get a real-time scoreboard after every attempt",
  },
  {
    icon: SpeedRoundedIcon,
    text: "Timed sessions help you boost your speed & accuracy",
  },
];

export default function AppDownloadSection() {
  return (
    <Box
      id="app-download"
      sx={{
        scrollMarginTop: "80px",
        py: { xs: 2.5, md: 3.5 },
        backgroundColor: "var(--white)"
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            position: "relative",
            background:
              "linear-gradient(135deg, #E8FBEF 0%, #F6FFF8 55%, #FFFFFF 100%)",
            borderRadius: 4,
            px: { xs: 2.5, sm: 4, md: 5 },
            py: { xs: 3, sm: 3.5, md: 4 },
            overflow: "hidden",
          }}
        >
          <Grid
            container
            spacing={{ xs: 2, md: 1 }}
            sx={{ alignItems: "center" }}
          >
            {/* ================= PHONE IMAGE ================= */}
            <Grid
              size={{ xs: 12, md: 5 }}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                src="/img/home/phone.webp"
                alt="2212 App"
                width={520}
                height={520}
                unoptimized
                style={{
                  width: "100%",
                  maxWidth: "320px",
                  height: "auto",
                  filter: "drop-shadow(0 18px 28px rgba(0,0,0,.15))",
                }}
              />
            </Grid>

            {/* ================= CONTENT ================= */}
            <Grid
              size={{ xs: 12, md: 7 }}
              sx={{
                pl: { xs: 0, md: 3, lg: 8 },
              }}
            >
              <Stack
                spacing={1.5}
                sx={{
                  alignItems: { xs: "center", md: "flex-start" },
                  textAlign: { xs: "center", md: "left" },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: "#111827",
                    lineHeight: 1.15,
                    fontSize: {
                      xs: "1.7rem",
                      sm: "2.1rem",
                      md: "2.6rem",
                    },
                  }}
                >
                  Get the 2212 App.
                </Typography>

                <Typography
                  sx={{
                    color: "#5B6470",
                    fontSize: {
                      xs: "0.95rem",
                      md: "1.05rem",
                    },
                  }}
                >
                  Practice anytime, anywhere.
                </Typography>

                {/* ================= FEATURE LIST ================= */}
                <Stack
                  spacing={1.1}
                  sx={{
                    pt: 0.5,
                    width: "100%",
                    alignItems: { xs: "center", md: "flex-start" },
                  }}
                >
                  {features.map(({ icon: Icon, text }, i) => (
                    <Stack
                      key={i}
                      direction="row"
                      spacing={1.2}
                      sx={{
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 30,
                          height: 30,
                          flexShrink: 0,
                          borderRadius: "50%",
                          backgroundColor: "rgba(22, 163, 74, 0.12)",
                        }}
                      >
                        <Icon
                          sx={{
                            fontSize: 18,
                            color: "#16A34A",
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          color: "#374151",
                          fontSize: { xs: "0.88rem", md: "0.95rem" },
                          fontWeight: 500,
                          textAlign: "left",
                        }}
                      >
                        {text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* Store Buttons */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    pt: 1,
                    alignItems: "center",
                  }}
                >
                  <Box
                    component="a"
                    href="#"
                    sx={{
                      display: "inline-flex",
                      transition: "transform .25s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    <Image
                      src="/img/home/gogle-playstore.webp"
                      alt="Google Play"
                      width={180}
                      height={54}
                      style={{
                        width: "180px",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </Box>

                  <Box
                    component="a"
                    href="#"
                    sx={{
                      display: "inline-flex",
                      transition: "transform .25s ease",
                      "&:hover": {
                        transform: "translateY(-3px)",
                      },
                    }}
                  >
                    <Image
                      src="/img/home/apple-playstore.webp"
                      alt="App Store"
                      width={180}
                      height={54}
                      style={{
                        width: "180px",
                        height: "auto",
                        display: "block",
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
