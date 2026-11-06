"use client";

import { Box, Container, Typography, Stack } from "@mui/material";
import Image from "next/image";

const headingSx = {
  fontWeight: 800,
  color: "var(--black)",
  letterSpacing: "-0.02em",
  lineHeight: 1.15,
  fontSize: { xs: "2rem", md: "2rem" },
};

const underlineSx = {
  width: 56,
  height: 3,
  borderRadius: 2,
  bgcolor: "var(--primary)",
  mt: 1.25,
};

const bodySx = {
  color: "var(--foreground)",
  opacity: 0.7,
  fontWeight: 400,
  fontSize: { xs: "0.95rem", md: "1rem" },
  maxWidth: 440,
  lineHeight: 1.55,
};

export default function AboutHero() {
  return (
    <Box
      component="section"
      aria-labelledby="about-hero-heading"
      sx={{
        "--background": "#ffffff",
        "--foreground": "#000000",
        colorScheme: "light",
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(180deg, var(--primary-light) 0%, var(--background) 85%)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 2.75 } }}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: { xs: 4, sm: 5, md: 6 },
          }}
        >
          {/* Left: text */}
          <Box sx={{ flex: "1 1 380px", minWidth: 0 }}>
            <Stack spacing={{ xs: 3, md: 4 }}>
              {/* Our Vision */}
              <Stack spacing={1.75}>
                <Box>
                  <Typography
                    id="about-hero-heading"
                    component="h1"
                    variant="h3"
                    sx={headingSx}
                  >
                    Our Vision
                  </Typography>
                  <Box sx={underlineSx} />
                </Box>
                <Typography component="p" sx={bodySx}>
                  Attention Span Focus Concentration to every learner.
                </Typography>
              </Stack>

              {/* Our Mission */}
              <Stack spacing={1.75}>
                <Box>
                  <Typography component="h2" variant="h3" sx={headingSx}>
                    Our Mission
                  </Typography>
                  <Box sx={underlineSx} />
                </Box>
                <Typography component="p" sx={bodySx}>
                  To make quality mental math training accessible to every student
                and help them build a strong foundation for a successful future.
                </Typography>
              </Stack>
            </Stack>
          </Box>

          {/* Right: image (hidden on xs) */}
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              flex: "1 1 320px",
              minWidth: 0,
              maxWidth: 460,
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
                maskImage:
                  "radial-gradient(ellipse 75% 75% at center, #000 55%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 75% 75% at center, #000 55%, transparent 100%)",
              }}
            >
              <Image
                src="/img/about/hero_Sec.webp"
                alt="Notebook with mental math sketches, a brain diagram, pencils and books, representing Mental Calisthenics training"
                fill
                priority
                sizes="(max-width: 900px) 60vw, 460px"
                style={{ objectFit: "cover", objectPosition: "center" }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}