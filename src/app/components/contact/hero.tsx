"use client";

import Image from "next/image";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

const FEATURES = [
  { label: "Quick Response", icon: HeadsetMicOutlinedIcon },
  { label: "Friendly Support", icon: EmailOutlinedIcon },
  { label: "Trusted & Secure", icon: VerifiedUserOutlinedIcon },
];

export default function ContactHero() {
  return (
    <Box
      component="section"
      sx={{ pt: { xs: 3, md: 6 }, pb: { xs: 3, md: 6 } }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            gap: { xs: 6, md: 8 },
          }}
        >
          {/* Left: content */}
          <Box sx={{ flex: 1, width: "100%" }}>
            <Typography
              variant="overline"
              sx={{
                color: "var(--primary)",
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              Contact Us
            </Typography>

            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "2.25rem", md: "3rem" },
                lineHeight: 1.15,
                mt: 1,
                mb: 3,
              }}
            >
              We&apos;re Here to{" "}
              <Box component="span" sx={{ color: "var(--primary)" }}>
                Help
              </Box>{" "}
              You!
            </Typography>

            <Typography
              variant="body1"
              sx={{ color: "text.secondary", maxWidth: 480, mb: 4 }}
            >
              Have questions or feedback? We&apos;d love to hear from you. Reach
              out to us anytime!
            </Typography>

            {/* Feature badges */}
            <Box
              sx={{
                display: "flex",
                flexWrap: { xs: "nowrap", md: "wrap" },
                justifyContent: { xs: "space-between", md: "flex-start" },
                alignItems: "center",
                gap: { xs: 1, md: 0 },
              }}
            >
              {FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Box
                    key={feature.label}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: "center",
                      textAlign: { xs: "center", md: "left" },
                      gap: { xs: 1, md: 1.5 },
                      flex: 1,
                      minWidth: { xs: 0, md: 140 },
                      pl: index === 0 ? 0 : { xs: 0, md: 3 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "var(--primary-light)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        flexShrink: 0,
                        transition:
                          "transform 0.25s ease, background-color 0.25s ease, color 0.25s ease",
                        "&:hover": {
                          bgcolor: "var(--primary)",
                          color: "var(--white)",
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography variant="body2" sx={{ lineHeight: 1.3 }}>
                      {feature.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Right: illustration */}
          <Box
            sx={{
              flex: 1,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Image
              src="/img/contact/contact.webp"
              alt="Contact us illustration"
              width={480}
              height={360}
              priority
              style={{
                width: "100%",
                maxWidth: 480,
                height: "auto",
                borderRadius: 16,
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}