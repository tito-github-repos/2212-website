"use client";

import React from "react";
import NextLink from "next/link";
import { Box, Container, Stack, Typography, Button, Divider } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";

const worksheets = {
  title: "Worksheet Download",
  subtitle: "Unlimited access to premium worksheets.",
  price: "₹ 222",
  priceSuffix: "/ Year",
  cta: "Download Worksheets",
  features: [
    "Best Brain fitness material.",
    "Best source for any aptitude based exams.",
    "Best material for any competitive exams.",
    "Best practice material - CSAT, CAT, XAT, IPMAT, CUCET, SAT, GMAT, LSAT, CLAT.",
  ],
  colors: {
    bg: "linear-gradient(180deg, #E9F9EE 0%, #F3FBF6 100%)",
    accent: "#19B44A",
    accentDark: "#12953c",
    blobBg: "#CFF3DA",
  },
};

const competition = {
  title: "Competitions",
  subtitle: "Build your confidence. Sharpen your skills.",
  price: "₹ 777",
  priceSuffix: "/ Year",
  cta: "Pay Now",
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
        {showBadge && (
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
        )}
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
          sx={{ color: "#6B7280", fontSize: { xs: "0.85rem", md: "0.9rem" }, mt: 0.5 }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
}

function PriceBar({
  price,
  priceSuffix,
  cta,
  accent,
  accentDark,
}: {
  price: string;
  priceSuffix: string;
  cta: string;
  accent: string;
  accentDark: string;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "#fff",
        borderRadius: 3,
        p: { xs: 1.5, md: 2 },
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "baseline" }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "1.8rem" }, color: accent }}>
          {price}
        </Typography>
        <Typography sx={{ color: "#6B7280", fontSize: { xs: "0.85rem", md: "0.95rem" } }}>
          {priceSuffix}
        </Typography>
      </Stack>
      <Button
        variant="contained"
        endIcon={<ArrowForwardIcon />}
        sx={{
          bgcolor: accent,
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 2.5,
          py: 1.1,
          px: { xs: 2, md: 3 },
          fontSize: { xs: "0.85rem", md: "0.95rem" },
          whiteSpace: "nowrap",
          "&:hover": { bgcolor: accentDark },
        }}
      >
        {cta}
      </Button>
    </Stack>
  );
}

export default function PremiumResourcesSection() {
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
        <Stack
          spacing={2}
          sx={{ textAlign: "center", alignItems: "center", mb: { xs: 4, md: 5 } }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              bgcolor: "#E9F9EE",
              color: "#19B44A",
              px: 2,
              py: 0.6,
              borderRadius: 5,
              fontWeight: 700,
              fontSize: "0.85rem",
            }}
          >
            <WorkspacePremiumIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
              Premium Resources
            </Typography>
          </Stack>

          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#111",
              fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.6rem" },
            }}
          >
            Premium <Box component="span" sx={{ color: "#19B44A" }}>Resources</Box> & Products
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              maxWidth: 560,
              mx: "auto",
              color: "#6B7280",
            }}
          >
            Quality resources to help you practice better and perform your best.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 3.5 },
            maxWidth: 1180,
            mx: "auto",
          }}
        >
          {/* Worksheet Download card */}
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
                <DescriptionOutlinedIcon sx={{ fontSize: 52, color: "#19B44A", opacity: 0.35 }} />
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
                <Stack key={f} direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                  <CheckCircleIcon sx={{ color: worksheets.colors.accent, fontSize: 19, mt: 0.15 }} />
                  <Typography variant="body2" sx={{ fontSize: { xs: 13.5, md: 14.5 }, color: "#333" }}>
                    {f}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <PriceBar
              price={worksheets.price}
              priceSuffix={worksheets.priceSuffix}
              cta={worksheets.cta}
              accent={worksheets.colors.accent}
              accentDark={worksheets.colors.accentDark}
            />
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
              <GpsFixedIcon sx={{ fontSize: 70, color: "#E8A800", opacity: 0.25, mr: -3 }} />
              <MenuBookIcon sx={{ fontSize: 46, color: "#19B44A", opacity: 0.3, mt: 5 }} />
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
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", py: 1.5 }}>
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
                      <block.icon sx={{ color: competition.colors.accent, fontSize: 20 }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontSize: { xs: 13.5, md: 14.5 }, color: "#333", lineHeight: 1.5 }}>
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

            <PriceBar
              price={competition.price}
              priceSuffix={competition.priceSuffix}
              cta={competition.cta}
              accent={competition.colors.accent}
              accentDark={competition.colors.accentDark}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}