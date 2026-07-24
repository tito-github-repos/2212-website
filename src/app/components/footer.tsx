"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";

const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/90765852/admin/dashboard/", icon: LinkedInIcon },
  { label: "Instagram", href: "https://www.instagram.com/2212users/", icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61586050855665", icon: FacebookIcon },
];

const LEGAL_LINKS = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
];

const socialIconSx = {
  color: "rgba(255, 255, 255, 0.7)",
  borderRadius: "50%",
  transition: "color 0.25s ease, background-color 0.25s ease",
  "&:hover": {
    color: "var(--white)",
    backgroundColor: "var(--primary)",
  },
} as const;

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "rgba(255, 255, 255, 0.1)",
        bgcolor: "var(--black)",
        py: 3,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Copyright */}
          <Typography
            variant="body2"
            sx={{ color: "rgba(255, 255, 255, 0.7)", order: { xs: 3, md: 1 } }}
          >
            &copy; 2026 2212. All rights reserved.
          </Typography>

          {/* Social icons */}
          <Box sx={{ display: "flex", gap: 1, order: { xs: 1, md: 2 } }}>
            {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
              <IconButton
                key={label}
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                size="small"
                sx={socialIconSx}
              >
                <Icon fontSize="small" />
              </IconButton>
            ))}
          </Box>

          {/* Legal links */}
          <Box
            sx={{
              display: "flex",
              gap: 3,
              order: { xs: 2, md: 3 },
            }}
          >
            {LEGAL_LINKS.map((link) => (
              <Typography
                key={link.href}
                component={Link}
                href={link.href}
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.7)",
                  textDecoration: "none",
                  transition: "color 0.25s ease",
                  "&:hover": {
                    color: "var(--primary)",
                  },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
