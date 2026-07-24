"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Container from "@mui/material/Container";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const registerButtonSx = {
  textTransform: "none",
  fontWeight: 600,
  borderRadius: 8,
  px: 2,
  background: "var(--primary)",
  transition: "box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease",
  "& .MuiButton-endIcon": {
    transition: "transform 0.3s ease",
  },
  "&:hover": {
    background: "var(--primary)",
    boxShadow: "rgba(22, 163, 74, 0.25) 0px 8px 18px -4px",
    transform: "translateY(-1px)",
  },
  "&:hover .MuiButton-endIcon": {
    transform: "translateX(5px)",
  },
} as const;

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const handleToggle = () => setMobileOpen((prev) => !prev);
  const handleClose = () => setMobileOpen(false);

  useEffect(() => {
    if (isDesktop && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div>
      <Box
        component="header"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 1100,
          bgcolor: isScrolled ? "rgba(255, 255, 255, 0.7)" : "background.paper",
          backdropFilter: isScrolled ? "blur(10px)" : "none",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: isScrolled ? "transparent" : "divider",
          transition:
            "background-color 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease",
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              py: 1.5,
              px: { xs: 2, md: 4 },
              minHeight: 64,
            }}
          >
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Image
                src="/img/logo.webp"
                alt="Drill Daily logo"
                width={36}
                height={36}
                priority
                style={{
                  borderRadius: 8,
                }}
              />
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  color: "var(--primary)",
                }}
              >
                2212
              </Typography>
            </Box>

            {/* Desktop nav */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Button
                    key={link.href}
                    component={Link}
                    href={link.href}
                    disableRipple
                    sx={{
                      position: "relative",
                      color: isActive ? "var(--primary)" : "text.primary",
                      fontWeight: isActive ? 700 : 500,
                      textTransform: "none",
                      fontSize: "0.9rem",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 6,
                        left: "50%",
                        width: 18,
                        height: 2.5,
                        borderRadius: 1,
                        backgroundColor: "var(--primary)",
                        transform: isActive
                          ? "translateX(-50%) scaleX(1)"
                          : "translateX(-50%) scaleX(0)",
                        transition: "transform 0.25s ease",
                      },
                      "&:hover::after": {
                        transform: "translateX(-50%) scaleX(1)",
                      },
                      "&:hover": {
                        backgroundColor: "var(--primary-light)",
                        borderRadius: 2,
                      },
                    }}
                  >
                    {link.label}
                  </Button>
                );
              })}

              {/* Vertical divider between nav links and register */}
              <Box
                sx={{
                  width: "1px",
                  height: 24,
                  bgcolor: "divider",
                  mx: 2,
                }}
              />

              <Button
                component={Link}
                href="/register"
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={registerButtonSx}
              >
                Register
              </Button>
            </Box>

            {/* Mobile menu toggle */}
            <IconButton
              aria-label="Open navigation menu"
              onClick={handleToggle}
              sx={{
                display: { xs: "flex", md: "none" },
                bgcolor: "var(--primary-light)",
                color: "var(--primary)",
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "var(--primary-light)",
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={handleClose}>
        <Box
          sx={{
            width: 280,
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
            <IconButton
              aria-label="Close navigation menu"
              onClick={handleClose}
              sx={{
                bgcolor: "var(--primary-light)",
                color: "var(--primary)",
                borderRadius: "50%",
                "&:hover": {
                  bgcolor: "var(--primary-light)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          <List
            sx={{
              px: 2,
              py: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <ListItem key={link.href} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={link.href}
                    onClick={handleClose}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "var(--primary-light)",
                      },
                      "&.Mui-selected": {
                        bgcolor: "var(--primary-light)",
                      },
                      "&.Mui-selected:hover": {
                        bgcolor: "var(--primary-light)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={link.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontWeight: isActive ? 700 : 500,
                            color: "var(--primary)",
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
          <Box sx={{ px: 2, mt: 2 }}>
            <Button
              component={Link}
              href="/register"
              onClick={handleClose}
              variant="contained"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              sx={registerButtonSx}
            >
              Register
            </Button>
          </Box>
        </Box>
      </Drawer>
    </div>
  );
}
