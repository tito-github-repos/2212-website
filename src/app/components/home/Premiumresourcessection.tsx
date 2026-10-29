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
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";

import AccessModal, { type Product } from "./AccessModal";
// Book section is switched off for now. To bring it back, uncomment this import
// and the <BookSection /> line further down.
// import BookSection from "./booksection";

const GREEN = "#19B44A";
const GREEN_DARK = "#12953c";
const GREEN_DARKER = "#0e7d32";

/* ---------------- The two product banners ---------------- */
type BannerData = {
  product: Product;
  illustration: "worksheet" | "webapp";
  mobileIcon: React.ElementType;
  title: string;
  tagline: string;
  features: string[];
  price: string;
  priceSuffix: string;
  priceNote: string;
  cta: string;
};

const banners: BannerData[] = [
  {
    product: "WORKSHEET",
    illustration: "worksheet",
    mobileIcon: DescriptionOutlinedIcon,
    title: "DD Worksheets",
    tagline: "Do Daily. Drill Daily.",
    features: [
      "Unlimited worksheet downloads",
      "16 Mental Calisthenics sheets",
      "60 questions in each worksheet",
      // "Eligible to join the competitions",
      "Be a Qualifier and get online coaching scholarship",
    ],
    price: "₹ 111",
    priceSuffix: "/ Year",
    priceNote: "Worksheet PDF downloads",
    cta: "Get DD Worksheets",
  },
  {
    product: "WEBAPP",
    illustration: "webapp",
    mobileIcon: TimerOutlinedIcon,
    title: "DD Web App",
    tagline: "Do Daily. Drill Daily.",
    features: [
      "Timed tests on all 16 topics",
      "Voice answers, instant scores",
      "Multiple modes to practice",
      "See your score history",
      // "Eligible to join the competitions",
      "Be a Qualifier and get online coaching scholarship",
    ],
    price: "₹ 333",
    priceSuffix: "/ Month",
    priceNote: "Web application access",
    cta: "Get DD Web App",
  },
];

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
        "Every year, we conduct competitions on all Saturdays and Sundays every month in your school premises.",
      // "Every year, we conduct competitions at schools on all Saturdays and Sundays during November and December.",
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

/* ---------------- Illustration: worksheet paper (DD Worksheet banner) ---------------- */
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

      {/* Tilted worksheet card */}
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
          p: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        {/* 2212 chip */}
        <Box
          sx={{
            border: "1.5px solid #D5DCD8",
            borderRadius: 5,
            px: 1.25,
            py: 0.25,
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: GREEN }}>
            2212
          </Typography>
        </Box>

        {/* One sample question with a blank line to write the answer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 0.75,
            whiteSpace: "nowrap",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: 20,
              color: "#111",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            17
            <Box component="sup" sx={{ fontSize: 12 }}>
              2
            </Box>{" "}
            =
          </Typography>
          <Box
            sx={{
              width: 28,
              borderBottom: "1.5px solid #111",
              mb: "1px",
            }}
          />
        </Box>
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

/* ---------------- Illustration: a quiz question (DD Web App banner) ---------------- */
function WebAppIllustration() {
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

      {/* Tilted question card */}
      <Box
        sx={{
          position: "absolute",
          top: 6,
          left: 50,
          width: 128,
          height: 158,
          bgcolor: "#fff",
          borderRadius: 3,
          transform: "rotate(8deg)",
          boxShadow: "0 14px 28px rgba(25,180,74,0.18)",
          p: 1.75,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        {/* Timer chip */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            alignItems: "center",
            border: "1.5px solid #D5DCD8",
            borderRadius: 5,
            px: 1,
            py: 0.25,
          }}
        >
          <TimerOutlinedIcon sx={{ fontSize: 14, color: GREEN }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>
            00:07
          </Typography>
        </Stack>

        {/* Question */}
        <Typography sx={{ fontWeight: 800, fontSize: 22, color: "#111" }}>
          9+2 = ?
        </Typography>

        {/* Progress bar */}
        <Box
          sx={{
            height: 4,
            width: "80%",
            borderRadius: 2,
            bgcolor: "#E4E9E6",
          }}
        >
          <Box
            sx={{ height: 4, width: "60%", borderRadius: 2, bgcolor: GREEN }}
          />
        </Box>
      </Box>

      {/* Voice badge */}
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
        <MicRoundedIcon sx={{ color: "#fff", fontSize: 34 }} />
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

/* ---------------- Feature row used inside the banners ---------------- */
function BannerFeature({ text }: { text: string }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
      <CheckCircleIcon sx={{ color: GREEN, fontSize: 20, mt: 0.1 }} />
      <Typography sx={{ fontSize: { xs: 14, md: 15 }, color: "#4B5563" }}>
        {text}
      </Typography>
    </Stack>
  );
}

/* ---------------- One product banner (used for both products) ---------------- */
function ProductBanner({
  banner,
  onOpen,
}: {
  banner: BannerData;
  onOpen: () => void;
}) {
  const MobileIcon = banner.mobileIcon;

  return (
    <Box
      id={`banner-${banner.product.toLowerCase()}`}
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
        scrollMarginTop: "80px",
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
        {banner.illustration === "worksheet" ? (
          <WorksheetIllustration />
        ) : (
          <WebAppIllustration />
        )}

        {/* Middle: title + features */}
        <Box sx={{ flexGrow: 1, width: "100%", minWidth: 0 }}>
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
              <MobileIcon sx={{ color: "#fff", fontSize: 24 }} />
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
                {banner.title}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", md: "1.35rem" },
                  color: GREEN,
                  mt: 0.25,
                }}
              >
                {banner.tagline}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1}>
            {banner.features.map((f) => (
              <BannerFeature key={f} text={f} />
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
          sx={{ width: { xs: "100%", md: 260 }, minWidth: { md: 360 } }}
        >
          <Box
            sx={{
              bgcolor: "#fff",
              border: "1px solid #BFE8CC",
              borderRadius: 3,
              py: 1.25,
              px: 2,
              textAlign: "center",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "baseline", justifyContent: "center" }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "2rem", md: "2.6rem" },
                  color: GREEN_DARK,
                  lineHeight: 1.1,
                }}
              >
                {banner.price}
              </Typography>
              <Typography sx={{ color: "#6B7280", fontSize: "1rem" }}>
                {banner.priceSuffix}
              </Typography>
            </Stack>
            <Typography
              sx={{
                color: "#6B7280",
                fontSize: { xs: 12.5, md: 13 },
                mt: 0.5,
                lineHeight: 1.4,
              }}
            >
              {banner.priceNote}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            onClick={onOpen}
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
            {banner.cta}
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
        {/* DD Worksheet banner, then DD Web App banner (stacked) */}
        {banners.map((banner) => (
          <ProductBanner
            key={banner.product}
            banner={banner}
            onOpen={() => setActiveProduct(banner.product)}
          />
        ))}

        {/* Book banner (switched off for now) */}
        {/* <BookSection /> */}

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
