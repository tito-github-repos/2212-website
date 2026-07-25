"use client";

import { Box, Container, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FlagCircleIcon from "@mui/icons-material/FlagCircle";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import GroupsIcon from "@mui/icons-material/Groups";
import DescriptionIcon from "@mui/icons-material/Description";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import StarIcon from "@mui/icons-material/Star";
import Image from "next/image";

const leftPoints = [
  "Improves concentration and focus",
  "Enhances memory and recall",
  "Increases speed and accuracy",
];

const rightPoints = [
  "Builds confidence in tackling problems",
  "Useful for academic and competitive exams",
];

const stats = [
  { icon: GroupsIcon, value: "25K+", label: "Happy Students" },
  { icon: DescriptionIcon, value: "10K+", label: "Practice Worksheets" },
  { icon: EmojiEventsIcon, value: "2K+", label: "Competitions Held" },
  { icon: StarIcon, value: "98%", label: "Student Satisfaction" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
      <Box sx={{ width: 4, height: 16, bgcolor: "var(--primary)", borderRadius: 0.5, flexShrink: 0 }} />
      <Typography
        sx={{
          color: "var(--primary)",
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      <CheckCircleIcon sx={{ color: "var(--primary)", fontSize: 22, mt: "2px", flexShrink: 0 }} />
      <Typography sx={{ fontWeight: 600, color: "var(--black)", fontSize: "0.95rem" }}>
        {text}
      </Typography>
    </Box>
  );
}

export default function AboutSections() {
  return (
    <Box
      sx={{
        "--background": "#ffffff",
        "--foreground": "#000000",
        colorScheme: "light",
        bgcolor: "#ffffff",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 5, md: 6 }, px: { xs: 2.5, sm: 3, md: 3 } }}>
        {/* ---------- About Mental Calisthenics ---------- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 4, md: 6 },
            alignItems: "center",
            mb: { xs: 4, md: 6 },
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: { xs: "1 / 1", sm: "1.15 / 1" },
              maxWidth: { xs: 420, md: "none" },
              mx: { xs: "auto", md: 0 },
            }}
          >
            <Image
              src="/img/about/about_sec.webp"
              alt="Diagram of the brain's two hemispheres showing the benefits of Mental Calisthenics: better focus, stronger memory, problem solving, faster thinking, and academic excellence"
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              style={{ objectFit: "contain" }}
            />
          </Box>

          <Box>
            <SectionLabel>About Mental Calisthenics</SectionLabel>
            <Typography
              component="h2"
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "var(--black)",
                mb: 2,
                fontSize: { xs: "1.5rem", sm: "1.7rem", md: "1.9rem" },
              }}
            >
              What is Mental Calisthenics?
            </Typography>
            <Typography
              sx={{
                color: "var(--foreground)",
                opacity: 0.7,
                lineHeight: 1.7,
                mb: 3,
                fontSize: { xs: "0.9rem", md: "1rem" },
              }}
            >
              Mental Calisthenics is a systematic training of the brain through
              math-based exercises. Just like physical exercises strengthen our
              body, mental exercises improve our focus, memory, speed and
              problem-solving abilities.
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: { xs: 2, sm: 2.5 },
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
                {leftPoints.map((text) => (
                  <CheckItem key={text} text={text} />
                ))}
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}>
                {rightPoints.map((text) => (
                  <CheckItem key={text} text={text} />
                ))}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ---------- Why 2212 / Who is Ramanujan ---------- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 3 },
            mb: { xs: 4, md: 6 },
          }}
        >
          <Box
            sx={{
              position: "relative",
              bgcolor: "#fff",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              p: { xs: 3, md: 4 },
              height: "100%",
              overflow: "hidden",
            }}
          >
            <SectionLabel>Why &ldquo;2212&rdquo;?</SectionLabel>
            <Typography
              sx={{ color: "var(--foreground)", opacity: 0.75, lineHeight: 1.7, mb: 3, fontSize: "0.95rem" }}
            >
              2212 is a tribute to the birth anniversary of Srinivasa
              Ramanujan, one of the greatest mathematicians of India.
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                bgcolor: "var(--primary-light)",
                borderRadius: 2,
                p: { xs: 2, sm: 2.5 },
                mb: 3,
              }}
            >
              <CalendarMonthIcon sx={{ color: "var(--primary)", fontSize: { xs: 30, sm: 34 }, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ fontWeight: 800, color: "var(--primary)", fontSize: { xs: "1.4rem", sm: "1.6rem" }, lineHeight: 1 }}>
                  2212
                </Typography>
                <Typography sx={{ color: "var(--foreground)", opacity: 0.6, fontSize: "0.85rem", mt: 0.5 }}>
                  22 December 1887
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ color: "var(--foreground)", opacity: 0.75, lineHeight: 1.7, fontSize: "0.95rem", pr: 4 }}>
              His legacy inspires us to think, explore and achieve
              excellence in mathematics.
            </Typography>

            <FormatQuoteIcon
              sx={{
                position: "absolute",
                right: 18,
                bottom: 14,
                fontSize: 26,
                color: "var(--foreground)",
                opacity: 0.12,
              }}
            />
          </Box>

          <Box
            sx={{
              bgcolor: "#fff",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              p: { xs: 3, md: 4 },
              height: "100%",
            }}
          >
            <SectionLabel>Who is Ramanujan?</SectionLabel>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "auto 1fr", sm: "auto 1fr" },
                gap: { xs: 2, sm: 2.5 },
                mt: 1.5,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: { xs: 78, sm: 110 },
                  aspectRatio: "3 / 4",
                  borderRadius: 2,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <Image
                  src="/img/about/ramanujam.webp"
                  alt="Portrait of Srinivasa Ramanujan"
                  fill
                  sizes="200px"
                  style={{ objectFit: "cover" }}
                />
              </Box>
              <Box>
                <Typography sx={{ color: "var(--foreground)", opacity: 0.75, lineHeight: 1.7, fontSize: { xs: "0.85rem", sm: "0.9rem" } }}>
                  Srinivasa Ramanujan (1887–1920) was a self-taught
                  mathematician who made extraordinary contributions to
                  number theory, infinite series, and mathematical analysis.
                </Typography>
                <Typography
                  sx={{ color: "var(--foreground)", opacity: 0.75, lineHeight: 1.7, fontSize: { xs: "0.85rem", sm: "0.9rem" }, mt: 1.5 }}
                >
                  His work continues to inspire millions of students and
                  mathematicians around the world.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* ---------- Our Mission ---------- */}
        <Box
          sx={{
            position: "relative",
            bgcolor: "var(--primary-light)",
            borderRadius: 3,
            pl: { xs: 3, md: 7 },
            pr: { xs: 3, md: 4 },
            pt: { xs: 6, md: 4 },
            pb: { xs: 4, md: 4 },
            mb: { xs: 4, md: 6 },
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: { xs: 2.5, md: 4 },
          }}
        >
          <Box
            sx={{
              position: { xs: "absolute", md: "absolute" },
              left: { xs: "50%", md: -32 },
              top: { xs: -28, md: "50%" },
              transform: { xs: "translateX(-50%)", md: "translateY(-50%)" },
              width: { xs: 64, md: 84 },
              height: { xs: 64, md: 84 },
              borderRadius: "50%",
              bgcolor: "#fff",
              border: "2px solid var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FlagCircleIcon sx={{ color: "var(--primary)", fontSize: { xs: 32, md: 42 } }} />
          </Box>

          <Box sx={{ flex: 1, pl: { md: 3 }, textAlign: { xs: "center", md: "left" } }}>
            <Typography
              sx={{
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                mb: 0.75,
              }}
            >
              Our Mission
            </Typography>
            <Typography sx={{ color: "var(--foreground)", opacity: 0.75, lineHeight: 1.7, fontSize: "0.95rem" }}>
              To make quality mental math training accessible to every student
              and help them build a strong foundation for a successful future.
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              width: { xs: "100%", md: 200 },
              height: { xs: 120, md: 110 },
              flexShrink: 0,
            }}
          >
            <Image
              src="/img/about/abot_sec2.webp"
              alt="Illustration of a flag planted on a mountain peak, symbolizing 2212's mission"
              fill
              sizes="(max-width: 900px) 100vw, 200px"
              style={{ objectFit: "contain" }}
            />
          </Box>
        </Box>

        {/* ---------- Stats bar ---------- */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
            gap: { xs: 3, sm: 3 },
          }}
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <Box
              key={label}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 1.25,
              }}
            >
              <Box
                sx={{
                  width: { xs: 44, sm: 48 },
                  height: { xs: 44, sm: 48 },
                  borderRadius: "50%",
                  bgcolor: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon sx={{ color: "var(--primary)", fontSize: { xs: 20, sm: 24 } }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: "var(--black)", fontSize: { xs: "1.2rem", sm: "1.4rem" } }}>
                {value}
              </Typography>
              <Typography sx={{ color: "var(--foreground)", opacity: 0.6, fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}