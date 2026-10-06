"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Divider,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CheckIcon from "@mui/icons-material/Check";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";

import AccessModal, { type Product } from "./AccessModal";

const GREEN = "#19B44A";
const GREEN_DARK = "#12953c";
const GREEN_DARKER = "#0e7d32";

/* ---------------- Download Worksheets banner data ---------------- */
const downloadBanner = {
  title: "Download Worksheets",
  tagline: "Do daily. Drill daily.",
  price: "₹ 729",
  priceSuffix: "/ Year",
  cta: "Download Worksheets",
  features: [
    "Unlimited worksheet downloads",
    "Valid for one full year",
    "Eligible to join the competitions",
  ],
};

const worksheets = {
  title: "About MCE Worksheets",
  subtitle: "Unlimited access to premium worksheets.",
  features: [
    "Best Brain fitness material.",
    "Super source for any aptitude exams.",
    // "Best material for any competitive exams.",
    "Perfect practice material - CSAT, CAT, XAT, IPMAT, CUCET, SAT, GMAT, LSAT, CLAT, NDA, CDSE.",
  ],
  colors: {
    bg: "linear-gradient(180deg, #E9F9EE 0%, #F3FBF6 100%)",
    accent: GREEN,
    accentDark: GREEN_DARK,
    blobBg: "#CFF3DA",
  },
};

const competition = {
  title: "Competitions",
  subtitle: "Build your confidence. Sharpen your skills.",
  infoBlocks: [
    {
      icon: CalendarMonthOutlinedIcon,
      textBefore:
        "Every year, we conduct competitions at schools on all Saturdays and Sundays during November and December.",
      linkText: "",
      textAfter: "",
      href: "",
    },
    {
      icon: ApartmentOutlinedIcon,
      textBefore:
        "Schools and academic institutions interested in conducting competitions at their premises are welcome to ",
      linkText: "contact us",
      textAfter: ".",
      href: "/contact",
    },
  ],
  colors: {
    bg: "linear-gradient(180deg, #FDF3DC 0%, #FDF8ED 100%)",
    accent: "#E8A800",
    accentDark: "#c98f00",
    blobBg: "#FBE7B8",
  },
};

/* ---------------- Worksheet paper illustration (left of banner) ---------------- */
function WorksheetIllustration() {
  return (
    <Box
      sx={{
        position: "relative",
        width: 210,
        height: 190,
        minWidth: 210,
        display: { xs: "none", md: "block" },
      }}
    >
      {/* Soft round backdrop */}
      <Box
        sx={{
          position: "absolute",
          top: 10,
          left: 0,
          width: 150,
          height: 160,
          borderRadius: "50%",
          bgcolor: "rgba(25,180,74,0.10)",
        }}
      />

      {/* Tilted paper */}
      <Box
        sx={{
          position: "absolute",
          top: 6,
          left: 50,
          width: 128,
          height: 158,
          bgcolor: "#fff",
          borderRadius: 3,
          transform: "rotate(-8deg)",
          boxShadow: "0 14px 28px rgba(25,180,74,0.18)",
          p: 1.75,
        }}
      >
        {/* Logo */}
        <Typography
          sx={{
            fontWeight: 800,
            color: GREEN,
            fontSize: 13,
            lineHeight: 1,
            mb: 1.5,
          }}
        >
          2212
        </Typography>

        {/* Checklist rows */}
        <Stack spacing={1.25}>
          {[0, 1, 2].map((i) => (
            <Stack
              key={i}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <Box
                sx={{
                  width: 15,
                  height: 15,
                  minWidth: 15,
                  borderRadius: 0.75,
                  bgcolor: GREEN,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckIcon sx={{ color: "#fff", fontSize: 12 }} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "#D5DCD8",
                    mb: 0.6,
                  }}
                />
                <Box
                  sx={{
                    height: 4,
                    width: "65%",
                    borderRadius: 2,
                    bgcolor: "#E4E9E6",
                  }}
                />
              </Box>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Download badge */}
      <Box
        sx={{
          position: "absolute",
          bottom: 4,
          right: 22,
          width: 66,
          height: 66,
          borderRadius: "50%",
          bgcolor: GREEN,
          border: "4px solid #fff",
          boxShadow: "0 10px 20px rgba(25,180,74,0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FileDownloadOutlinedIcon sx={{ color: "#fff", fontSize: 36 }} />
      </Box>

      {/* Little sparkle strokes */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 4,
          width: 14,
          height: 3,
          bgcolor: GREEN,
          borderRadius: 2,
          transform: "rotate(-35deg)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 26,
          right: -4,
          width: 14,
          height: 3,
          bgcolor: GREEN,
          borderRadius: 2,
          transform: "rotate(10deg)",
        }}
      />
    </Box>
  );
}

/* ---------------- Download Worksheets banner ---------------- */
function DownloadBanner({ onDownload }: { onDownload: () => void }) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        maxWidth: 1180,
        mx: "auto",
        mb: { xs: 3, md: 3.5 },
        borderRadius: 5,
        background: "linear-gradient(180deg, #E9F9EE 0%, #F3FBF6 100%)",
        border: "1px solid #CFEFD9",
        p: { xs: 3, md: 3.5 },
      }}
    >
      {/* Corner blobs */}
      <Box
        sx={{
          position: "absolute",
          top: -60,
          left: -50,
          width: 190,
          height: 190,
          borderRadius: "50%",
          bgcolor: "rgba(25,180,74,0.10)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -70,
          right: -50,
          width: 190,
          height: 190,
          borderRadius: "50%",
          bgcolor: "rgba(25,180,74,0.10)",
        }}
      />

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 3 }}
        sx={{ position: "relative", zIndex: 1, alignItems: "center" }}
      >
        <WorksheetIllustration />

        {/* Middle: title + features */}
        <Box sx={{ flexGrow: 1, width: "100%" }}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, mb: 2 }}>
            {/* Icon: mobile only */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                width: 44,
                height: 44,
                minWidth: 44,
                borderRadius: 2.5,
                bgcolor: GREEN,
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(25,180,74,0.3)",
              }}
            >
              <DescriptionOutlinedIcon sx={{ color: "#fff", fontSize: 24 }} />
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "1.35rem", md: "2.1rem" },
                  color: "#111",
                  lineHeight: 1.15,
                }}
              >
                {downloadBanner.title}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", md: "1.35rem" },
                  color: GREEN,
                  mt: 0.25,
                }}
              >
                {downloadBanner.tagline}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.25}>
            {downloadBanner.features.map((f) => (
              <Stack
                key={f}
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <CheckCircleIcon sx={{ color: GREEN, fontSize: 22 }} />
                <Typography
                  sx={{ fontSize: { xs: 14.5, md: 16 }, color: "#4B5563" }}
                >
                  {f}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Divider (vertical on desktop, horizontal on mobile) */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            display: { xs: "none", md: "block" },
            borderColor: "#C6E9D1",
            my: 1,
          }}
        />
        <Divider
          sx={{
            display: { xs: "block", md: "none" },
            width: "100%",
            borderColor: "#C6E9D1",
          }}
        />

        {/* Right: price + CTA */}
        <Stack
          spacing={2}
          sx={{ width: { xs: "100%", md: 300 }, minWidth: { md: 300 } }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "baseline",
              justifyContent: "center",
              bgcolor: "#fff",
              border: "1px solid #BFE8CC",
              borderRadius: 3,
              py: 1.25,
              px: 2,
            }}
          >
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2rem", md: "2.6rem" },
                color: GREEN_DARK,
                lineHeight: 1.1,
              }}
            >
              {downloadBanner.price}
            </Typography>
            <Typography sx={{ color: "#6B7280", fontSize: "1rem" }}>
              {downloadBanner.priceSuffix}
            </Typography>
          </Stack>

          <Button
            variant="contained"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            // onClick={onDownload}
            sx={{
              bgcolor: GREEN_DARK,
              color: "#fff",
              textTransform: "none",
              fontWeight: 700,
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              borderRadius: 3,
              py: 1.5,
              boxShadow: "0 10px 20px rgba(18,149,60,0.3)",
              "&:hover": { bgcolor: GREEN_DARKER },
            }}
          >
            {downloadBanner.cta}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

/* ---------------- Existing card pieces ---------------- */
function CardHeader({
  Icon,
  title,
  subtitle,
  blobBg,
  accent,
  showBadge,
}: {
  Icon: React.ElementType;
  title: string;
  subtitle: string;
  blobBg: string;
  accent: string;
  showBadge?: boolean;
}) {
  return (
    <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-start" }}>
      <Box sx={{ position: "relative", minWidth: 84 }}>
        <Box
          sx={{
            width: 84,
            height: 84,
            borderRadius: "40% 60% 55% 45% / 50% 45% 55% 50%",
            bgcolor: blobBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon sx={{ color: accent, fontSize: 38 }} />
        </Box>
        {/* {showBadge && (
          <Box
            sx={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 30,
              height: 30,
              borderRadius: "50%",
              bgcolor: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2.5px solid #fff",
            }}
          >
            <ArrowDownwardIcon sx={{ color: "#fff", fontSize: 16 }} />
          </Box>
        )} */}
      </Box>
      <Box sx={{ pt: 0.5 }}>
        <Typography
          sx={{
            fontWeight: 800,
            fontSize: { xs: "1.3rem", md: "1.5rem" },
            color: "#111",
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: "#6B7280",
            fontSize: { xs: "0.85rem", md: "0.9rem" },
            mt: 0.5,
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function PremiumResourcesSection() {
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  return (
    <Box
      id="premium-resources"
      sx={{
        pt: { xs: 3, md: 5 },
        pb: { xs: 5, md: 7 },
        bgcolor: "#fff",
        scrollMarginTop: "80px",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Download Worksheets banner */}
        <DownloadBanner onDownload={() => setActiveProduct("WORKSHEET")} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 3.5 },
            maxWidth: 1180,
            mx: "auto",
          }}
        >
          {/* About MCE Worksheets card */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 5,
              background: worksheets.colors.bg,
              p: { xs: 3, md: 4 },
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Decorative illustration accent */}
            <Box
              sx={{
                position: "absolute",
                top: { xs: 20, md: 30 },
                right: { xs: -10, md: 10 },
                opacity: 0.9,
                transform: "rotate(8deg)",
                display: { xs: "none", sm: "block" },
              }}
            >
              <Box
                sx={{
                  width: 110,
                  height: 130,
                  bgcolor: "#fff",
                  borderRadius: 2,
                  boxShadow: "0 12px 24px rgba(25,180,74,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DescriptionOutlinedIcon
                  sx={{ fontSize: 52, color: "#19B44A", opacity: 0.35 }}
                />
              </Box>
            </Box>

            <CardHeader
              Icon={DescriptionOutlinedIcon}
              title={worksheets.title}
              subtitle={worksheets.subtitle}
              blobBg={worksheets.colors.blobBg}
              accent={worksheets.colors.accent}
              showBadge
            />

            <Stack spacing={1.5} sx={{ flexGrow: 1, zIndex: 1 }}>
              {worksheets.features.map((f) => (
                <Stack
                  key={f}
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "flex-start" }}
                >
                  <CheckCircleIcon
                    sx={{
                      color: worksheets.colors.accent,
                      fontSize: 19,
                      mt: 0.15,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: { xs: 13.5, md: 14.5 }, color: "#333" }}
                  >
                    {f}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Competitions card */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 5,
              background: competition.colors.bg,
              p: { xs: 3, md: 4 },
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {/* Decorative illustration accent */}
            <Box
              sx={{
                position: "absolute",
                top: { xs: 16, md: 26 },
                right: { xs: -14, md: 6 },
                opacity: 0.9,
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
              }}
            >
              <GpsFixedIcon
                sx={{ fontSize: 70, color: "#E8A800", opacity: 0.25, mr: -3 }}
              />
              <MenuBookIcon
                sx={{ fontSize: 46, color: "#19B44A", opacity: 0.3, mt: 5 }}
              />
            </Box>

            <CardHeader
              Icon={EmojiEventsOutlinedIcon}
              title={competition.title}
              subtitle={competition.subtitle}
              blobBg={competition.colors.blobBg}
              accent={competition.colors.accent}
            />

            <Stack spacing={0} sx={{ flexGrow: 1, zIndex: 1 }}>
              {competition.infoBlocks.map((block, i) => (
                <React.Fragment key={block.textBefore}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "flex-start", py: 1.5 }}
                  >
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        minWidth: 38,
                        borderRadius: 2,
                        bgcolor: "rgba(255,255,255,0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <block.icon
                        sx={{ color: competition.colors.accent, fontSize: 20 }}
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: 13.5, md: 14.5 },
                        color: "#333",
                        lineHeight: 1.5,
                      }}
                    >
                      {block.textBefore}
                      {block.linkText && (
                        <Box
                          component={NextLink}
                          href={block.href}
                          sx={{
                            color: competition.colors.accent,
                            fontWeight: 700,
                            textDecoration: "underline",
                            textUnderlineOffset: "2px",
                            "&:hover": { color: competition.colors.accentDark },
                          }}
                        >
                          {block.linkText}
                        </Box>
                      )}
                      {block.textAfter}
                    </Typography>
                  </Stack>
                  {i < competition.infoBlocks.length - 1 && (
                    <Divider sx={{ borderColor: "rgba(0,0,0,0.08)" }} />
                  )}
                </React.Fragment>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>

      {activeProduct && (
        <AccessModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
        />
      )}
    </Box>
  );
}
