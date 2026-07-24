"use client";

import { Box, Container, Typography, Breadcrumbs, Link as MuiLink, Stack } from "@mui/material";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import NextLink from "next/link";
import Image from "next/image";

export default function AboutHero() {
  return (
    <Box
      component="section"
      aria-labelledby="about-hero-heading"
      sx={{
        // Force light theme for this section regardless of system
        // prefers-color-scheme, since this design has no dark variant.
        "--background": "#ffffff",
        "--foreground": "#000000",
        colorScheme: "light",
        backgroundColor: "#ffffff",
        backgroundImage:
          "linear-gradient(180deg, var(--primary-light) 0%, var(--background) 60%)",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
      }}
    >
      {/* Left: text, kept inside a normal max-width container so it stays
          aligned with the rest of the site's content. This panel is 50%
          width on desktop so the image panel next to it gets the other
          exact half. */}
      <Box
        sx={{
          width: { xs: "100%", md: "50%" },
          display: "flex",
          alignItems: "center",
          py: { xs: 4, md: 5 },
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            pl: { xs: 3, sm: 4, md: 6, lg: 8 },
            pr: { xs: 3, sm: 4, md: 4 },
          }}
        >
          <Stack spacing={1.75}>
            <Breadcrumbs
              aria-label="breadcrumb"
              separator="›"
              sx={{
                fontSize: 13,
                "& .MuiBreadcrumbs-separator": { color: "var(--foreground)", opacity: 0.4 },
              }}
            >
              <MuiLink
                component={NextLink}
                href="/"
                underline="hover"
                sx={{ color: "var(--foreground)", opacity: 0.6, fontWeight: 500 }}
              >
                Home
              </MuiLink>
              <Typography component="span" sx={{ color: "var(--primary)", fontWeight: 600, fontSize: 13 }}>
                About Us
              </Typography>
            </Breadcrumbs>

            <Box>
              <Typography
                id="about-hero-heading"
                component="h1"
                variant="h3"
                sx={{
                  fontWeight: 800,
                  color: "var(--black)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  fontSize: { xs: "2rem", md: "2.5rem" },
                }}
              >
                About Us
              </Typography>
              <Box
                sx={{
                  width: 56,
                  height: 3,
                  borderRadius: 2,
                  bgcolor: "var(--primary)",
                  mt: 1.25,
                }}
              />
            </Box>

            <Typography
              component="p"
              sx={{
                color: "var(--foreground)",
                opacity: 0.7,
                fontWeight: 400,
                fontSize: { xs: "0.95rem", md: "1rem" },
                maxWidth: 440,
                lineHeight: 1.55,
              }}
            >
              Empowering young minds through Mental Calisthenics.
            </Typography>

            <Box
              component="blockquote"
              sx={{
                position: "relative",
                m: 0,
                bgcolor: "var(--primary-light)",
                borderRadius: 2,
                p: { xs: 2, md: 2.25 },
                pl: { xs: 2.5, md: 2.75 },
                maxWidth: 460,
              }}
            >
              <FormatQuoteRoundedIcon
                sx={{
                  color: "var(--primary)",
                  fontSize: 20,
                  opacity: 0.6,
                  display: "block",
                  mb: 0.5,
                }}
              />
              <Typography
                component="p"
                sx={{
                  color: "var(--black)",
                  fontStyle: "italic",
                  fontSize: { xs: "0.85rem", md: "0.9rem" },
                  lineHeight: 1.6,
                }}
              >
                &ldquo;Mathematics is not about numbers, equations, computations
                or algorithms: it is about understanding.&rdquo;
              </Typography>
              <Typography
                component="footer"
                sx={{ mt: 1, fontWeight: 600, color: "var(--primary)", fontSize: "0.85rem" }}
              >
                — Srinivasa Ramanujan
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Right: image panel — a direct sibling of the text panel, NOT
          nested inside the Container, so it isn't capped by the
          container's max-width. It bleeds all the way to the true right
          edge of the viewport, and stretches to match the text panel's
          height via the section's flex "stretch" alignment. */}
      <Box
        sx={{
          position: "relative",
          width: { xs: "100%", md: "50%" },
          minHeight: { xs: 320, sm: 380, md: "auto" },
          boxShadow: "inset 0 0 50px 14px var(--primary-light)",
        }}
      >
        <Image
          src="/img/about/about_hero.webp"
          alt="Notebook with mental math sketches, a brain diagram, pencils and books, representing Mental Calisthenics training"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </Box>
    </Box>
  );
}