"use client";

import { useState } from "react";
import Image from "next/image";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import BookOrderModal, { BOOK_PRICE } from "./BookOrderModal";

const GREEN = "#19B44A";
const GREEN_DARK = "#12953c";
const GREEN_DARKER = "#0e7d32";

const bookBanner = {
  title: "Get the 2212 Book",
  tagline: "Delivered to your address.",
  price: BOOK_PRICE.replace("₹", "₹ "),
  priceNote: "For one copy of the book",
  cta: "Order the Book",
  features: [
    "One copy of the book delivered to your address",
    "Fill in your delivery address and pay online",
    "Secure online payment",
  ],
};

export default function BookSection() {
  const [open, setOpen] = useState(false);

  return (
    <Box
      id="book"
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
        {/* Left: price + CTA (on mobile this comes after the content) */}
        <Stack
          spacing={2}
          sx={{
            order: { xs: 2, md: 1 },
            width: { xs: "100%", md: 360 },
            minWidth: { md: 360 },
          }}
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
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2rem", md: "2.6rem" },
                color: GREEN_DARK,
                lineHeight: 1.1,
              }}
            >
              {bookBanner.price}
            </Typography>
            <Typography
              sx={{
                color: "#6B7280",
                fontSize: { xs: 12.5, md: 13 },
                mt: 0.5,
              }}
            >
              {bookBanner.priceNote}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            endIcon={<ArrowForwardIcon />}
            onClick={() => setOpen(true)}
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
            {bookBanner.cta}
          </Button>
        </Stack>

        {/* Divider (vertical on desktop, horizontal on mobile) */}
        <Divider
          orientation="vertical"
          flexItem
          sx={{
            order: 2,
            display: { xs: "none", md: "block" },
            borderColor: "#C6E9D1",
            my: 1,
          }}
        />
        <Divider
          sx={{
            order: 2,
            display: { xs: "block", md: "none" },
            width: "100%",
            borderColor: "#C6E9D1",
          }}
        />

        {/* Middle: title + features (first on mobile) */}
        <Box
          sx={{
            order: { xs: 1, md: 3 },
            flexGrow: 1,
            width: "100%",
          }}
        >
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
              <MenuBookIcon sx={{ color: "#fff", fontSize: 24 }} />
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
                {bookBanner.title}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "1rem", md: "1.35rem" },
                  color: GREEN,
                  mt: 0.25,
                }}
              >
                {bookBanner.tagline}
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.25}>
            {bookBanner.features.map((f) => (
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

        {/* Right: book cover (desktop only, like the worksheet illustration) */}
        <Box
          sx={{
            order: 4,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            width: 210,
            minWidth: 210,
          }}
        >
          <Image
            src="/img/home/Mental_1.png"
            alt="Mental Calisthenics Practice Book"
            width={539}
            height={733}
            unoptimized
            style={{
              width: "100%",
              maxWidth: 190,
              height: "auto",
              display: "block",
              filter: "drop-shadow(0 16px 24px rgba(0,0,0,0.18))",
            }}
          />
        </Box>
      </Stack>

      {open && <BookOrderModal onClose={() => setOpen(false)} />}
    </Box>
  );
}