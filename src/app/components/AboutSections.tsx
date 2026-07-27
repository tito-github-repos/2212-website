"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FlagIcon from "@mui/icons-material/Flag";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
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

const green = "#128653";
const greenLight = "#eaf8f0";
const text = "#17231f";
const muted = "rgba(23, 35, 31, 0.72)";

const cardSx = {
  bgcolor: "#fff",
  border: "1px solid rgba(17, 88, 54, 0.1)",
  borderRadius: "8px",
  boxShadow: "0 10px 28px rgba(18, 42, 30, 0.06)",
};

const flatSx = {
  bgcolor: "transparent",
  border: "none",
  boxShadow: "none",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.4 }}>
      <Box sx={{ width: 4, height: 16, bgcolor: green, borderRadius: "2px", flexShrink: 0 }} />
      <Typography
        sx={{
          color: green,
          fontSize: { xs: 11, md: 12 },
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: 0,
          textTransform: "uppercase",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.4, minWidth: 0 }}>
      <CheckCircleIcon sx={{ color: green, fontSize: 22, mt: "1px", flexShrink: 0 }} />
      <Typography sx={{ color: text, fontSize: { xs: 13, md: 14 }, fontWeight: 750, lineHeight: 1.5 }}>
        {children}
      </Typography>
    </Box>
  );
}

export default function AboutSections() {
  const rightCardRef = useRef<HTMLDivElement>(null);
  const [matchedHeight, setMatchedHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const rightEl = rightCardRef.current;
    if (!rightEl) return;

    const mq = window.matchMedia("(min-width: 900px)");

    const update = () => {
      if (mq.matches) {
        setMatchedHeight(rightEl.offsetHeight);
      } else {
        setMatchedHeight(undefined);
      }
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(rightEl);
    mq.addEventListener("change", update);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);

  return (
    <Box component="section" sx={{ bgcolor: "#fff", color: text, width: "100%", py: { xs: 5, md: 7 } }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: "1080px",
          mx: "auto",
          px: { xs: 2.5, sm: 4, lg: 0 },
          boxSizing: "border-box",
        }}
      >
        {/* Row 1: brain image + intro/checklist.
            Uses grid-template-areas so mobile and desktop can have a
            genuinely different reading order, not just a reflow of the
            same order. Mobile: heading block -> image -> checklist.
            Desktop (sm+): image occupies its own left column spanning
            both rows, text stacks on the right — same as before. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "minmax(280px, 405px) minmax(0, 1fr)" },
            gridTemplateAreas: {
              xs: `"head" "image" "checklist"`,
              sm: `"image content"`,
            },
            gap: { xs: 3, md: 7 },
            alignItems: "start",
            mb: { xs: 4, md: 5 },
          }}
        >
          {/* Head + checklist used to be two separate grid-row areas
              ("head" in row 1, "checklist" in row 2) while the image
              spanned both rows. That coupled the two rows' auto-sizing
              to the image's intrinsic height, which forced a large gap
              between the paragraph and the checklist to make row 1 tall
              enough. Now head+checklist live in a single "content" area
              as one flex column, so their spacing is just their own gap
              — nothing pushed apart by the image's height. */}
          <Box
            sx={{
              gridArea: { xs: undefined, sm: "content" },
              display: { xs: "contents", sm: "flex" },
              flexDirection: "column",
              gap: { sm: 4, md: 5 },
            }}
          >
            <Box sx={{ gridArea: "head", pt: { md: 1 } }}>
              <SectionLabel>About Mental Calisthenics</SectionLabel>
              <Typography
                component="h2"
                sx={{
                  color: text,
                  fontSize: { xs: 26, sm: 32, md: 36 },
                  fontWeight: 850,
                  lineHeight: 1.18,
                  letterSpacing: 0,
                  mb: 2,
                }}
              >
                What is Mental Calisthenics?
              </Typography>
              <Typography sx={{ color: muted, fontSize: { xs: 14, md: 14.5 }, lineHeight: 1.85 }}>
                Mental Calisthenics is a systematic training of the brain through
                math-based exercises. Just like physical exercises strengthen our
                body, mental exercises improve our focus, memory, speed and
                problem-solving abilities.
              </Typography>
            </Box>

            <Box sx={{ gridArea: "checklist" }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: { xs: 2.2, sm: 3 },
                }}
              >
                <Box
                  sx={{
                    ...flatSx,
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 2.2, sm: 2.6 },
                  }}
                >
                  {leftPoints.map((point) => (
                    <CheckItem key={point}>{point}</CheckItem>
                  ))}
                </Box>
                <Box
                  sx={{
                    ...flatSx,
                    display: "flex",
                    flexDirection: "column",
                    gap: { xs: 2.2, sm: 2.6 },
                  }}
                >
                  {rightPoints.map((point) => (
                    <CheckItem key={point}>{point}</CheckItem>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              ...flatSx,
              gridArea: "image",
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              maxWidth: { xs: 230, sm: 405 },
              mx: { xs: "auto", sm: 0 },
              mt: { xs: 1, sm: 0 },
              overflow: "hidden",
              // The source asset's drop-shadow was exported with a hard,
              // flat cutoff right at the bottom of the canvas. Rather than
              // fix the raster asset, fade the last ~14% of the box to
              // transparent so that hard edge blends into the page's
              // white background instead of ending abruptly.
              maskImage:
                "linear-gradient(to bottom, #000 86%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 86%, transparent 100%)",
            }}
          >
            <Image
              src="/img/about/about_sec.webp"
              alt="Mental Calisthenics brain training benefits diagram"
              fill
              priority
              sizes="(max-width: 900px) 230px, 405px"
              style={{ objectFit: "contain" }}
            />
          </Box>
        </Box>

        {/* Row 2: Why 2212 + Who is Ramanujan */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "410px minmax(0, 1fr)" },
            gap: { xs: 3, md: 3.5 },
            alignItems: "start",
            mb: { xs: 3.5, md: 4 },
          }}
        >
          <Box
            sx={{
              ...cardSx,
              position: "relative",
              p: { xs: 2.5, md: 3 },
              overflow: "hidden",
              height: matchedHeight ? `${matchedHeight}px` : "auto",
            }}
          >
            <SectionLabel>Why "2212"?</SectionLabel>
            <Typography sx={{ color: muted, fontSize: { xs: 13, md: 13.5 }, lineHeight: 1.72, mb: 1.5 }}>
              2212 is a tribute to the birth anniversary of Srinivasa
              Ramanujan, one of the greatest mathematicians of India.
            </Typography>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.4,
                bgcolor: greenLight,
                borderRadius: "6px",
                px: 1.8,
                py: 1,
                mb: 1.4,
              }}
            >
              <CalendarMonthIcon sx={{ color: green, fontSize: 28, flexShrink: 0 }} />
              <Box>
                <Typography sx={{ color: green, fontSize: { xs: 20, md: 23 }, fontWeight: 850, lineHeight: 1 }}>
                  2212
                </Typography>
                <Typography sx={{ color: muted, fontSize: 11.5, fontWeight: 650, mt: 0.35 }}>
                  22 December 1887
                </Typography>
              </Box>
            </Box>

            <Typography sx={{ color: muted, fontSize: { xs: 13, md: 13.5 }, lineHeight: 1.72, pr: 4 }}>
              His legacy inspires us to think, explore and achieve excellence
              in mathematics.
            </Typography>
            <FormatQuoteIcon sx={{ position: "absolute", right: 18, bottom: 14, color: green, opacity: 0.12, fontSize: 34 }} />
          </Box>

          {/* "Who is Ramanujan?" card.
              Was a fixed two-column grid (narrow photo | text) at every
              breakpoint. On mobile that squeezed the bio into a cramped
              column next to a short photo, so the paragraph ran on far
              below the image with an awkward ragged shape. Now it uses
              grid-template-areas: mobile stacks photo on top, full-width
              bio paragraph below it; sm+ keeps the original side-by-side
              layout. */}
          <Box ref={rightCardRef} sx={{ ...cardSx, p: { xs: 2.5, md: 3 } }}>
            <SectionLabel>Who is Ramanujan?</SectionLabel>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "160px 1fr" },
                gridTemplateAreas: {
                  xs: `"photo" "bio"`,
                  sm: `"photo bio"`,
                },
                alignItems: "start",
                gap: { xs: 2, sm: 3 },
                mt: 1.5,
              }}
            >
              <Box
                sx={{
                  gridArea: "photo",
                  position: "relative",
                  width: { xs: "100%", sm: "100%" },
                  maxWidth: { xs: 260, sm: "none" },
                  mx: { xs: "auto", sm: 0 },
                  height: { xs: 190, sm: 160 },
                  borderRadius: "7px",
                  overflow: "hidden",
                  boxShadow: "0 6px 18px rgba(66, 39, 18, 0.16)",
                }}
              >
                <Image
                  src="/img/about/ramanujam.webp"
                  alt="Portrait of Srinivasa Ramanujan"
                  fill
                  sizes="(max-width: 600px) 260px, 160px"
                  style={{ objectFit: "cover" }}
                />
              </Box>

              <Box sx={{ gridArea: "bio", pt: { xs: 0, sm: 0.5 } }}>
                <Typography sx={{ color: muted, fontSize: { xs: 12.5, md: 13.2 }, lineHeight: 1.78, mb: 1.5 }}>
                  Srinivasa Ramanujan (1887-1920) was a self-taught
                  mathematician who made extraordinary contributions to number
                  theory, infinite series, and mathematical analysis.
                </Typography>
                <Typography sx={{ color: muted, fontSize: { xs: 12.5, md: 13.2 }, lineHeight: 1.78 }}>
                  His work continues to inspire millions of students and
                  mathematicians around the world.
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Row 3: Mission bar.
            The badge used to be absolutely positioned to float above the
            card's top edge, using the left grid column purely as an empty
            spacer. That left visible empty space in that column and put
            the badge in a disconnected spot above the card. Now the badge
            is a normal grid item sitting inside that same column, in flow
            next to "Our Mission" — no absolute positioning needed. */}
        <Box
          sx={{
            display: { xs: "flex", md: "grid" },
            flexDirection: { xs: "column" },
            alignItems: "center",
            gridTemplateColumns: { md: "92px minmax(0, 1fr) 300px" },
            gap: { xs: 2, md: 3 },
            bgcolor: greenLight,
            borderRadius: "8px",
            overflow: "hidden",
            px: { xs: 3, md: 4 },
            py: { xs: 2, md: 2 },
          }}
        >
          {/* Badge circle. Hidden on mobile since it duplicates the flag
              imagery already in the mountain illustration below it. */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#fff",
              border: `2px solid ${green}`,
              boxShadow: "0 7px 18px rgba(20, 41, 30, 0.1)",
              flexShrink: 0,
            }}
          >
            <FlagIcon sx={{ color: green, fontSize: 20, transform: "translate(1px, 1px)" }} />
          </Box>

          <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
            <Typography sx={{ color: green, fontSize: 13, fontWeight: 850, lineHeight: 1, letterSpacing: 0, textTransform: "uppercase", mb: 0.9 }}>
              Our Mission
            </Typography>
            <Typography sx={{ color: muted, fontSize: { xs: 12.8, md: 13.5 }, lineHeight: 1.72, maxWidth: 620 }}>
              To make quality mental math training accessible to every student
              and help them build a strong foundation for a successful future.
            </Typography>
          </Box>

          <Box
            sx={{
                position: "relative",
                width: { xs: "100%", md: "100%" },
                height: { xs: 110, md: 100 },
                mx: "auto",
                mt: 1,
                overflow: "hidden",
                borderRadius: "6px",
    
            }}
          >
            {/* The source asset has a flat, opaque background baked in
                around the mountains with a hard rectangular edge, which
                read as a separate white box floating inside the green
                card. A radial mask was tried here but didn't reliably
                hide that edge across box ratios. Scaling the image up
                slightly (while the parent clips overflow) pushes that
                flat border outside the visible frame instead, so only
                the illustration itself shows — no mask needed. */}
            <Image
              src="/img/about/abot_sec2.webp"
              alt="Flag on mountain peak illustration"
              fill
              sizes="(max-width: 900px) 300px, 300px"
              style={{
                objectFit: "cover",
                objectPosition: "center",
                transform: "scale(1.08)",
                }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}