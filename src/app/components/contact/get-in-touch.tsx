"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const CONTACT_ITEMS = [
  {
    icon: EmailOutlinedIcon,
    label: "Email Address",
    value: "2212users@gmail.com",
    accent: "primary",
  },
  {
    icon: LocalPhoneOutlinedIcon,
    label: "Phone Number",
    value: "+91 9499953256",
    accent: "secondary",
  },
  {
    icon: LocationOnOutlinedIcon,
    label: "Chennai Office",
    value:
      "B4, Lumiers Enclave, #5/1092, Giri Nagar Main Road, Ramapuram, Chennai 600089",
    accent: "primary",
  },
  {
    icon: AccessTimeOutlinedIcon,
    label: "Timing",
    value: "Mon–Fri | 9 AM – 6 PM",
    accent: "secondary",
  },
] as const;

const ACCENT_COLORS = {
  primary: { main: "var(--primary)", light: "var(--primary-light)" },
  secondary: { main: "var(--secondary)", light: "var(--secondary-light)" },
} as const;

type Accent = keyof typeof ACCENT_COLORS;

const getIconCircleSx = (accent: Accent) => ({
  width: 44,
  height: 44,
  borderRadius: "30%",
  bgcolor: ACCENT_COLORS[accent].light,
  color: ACCENT_COLORS[accent].main,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  transition: "background-color 0.25s ease, color 0.25s ease",
});

const getContactCardSx = (accent: Accent) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  p: 2,
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 3,
  bgcolor: "background.paper",
  boxShadow: "0 4px 16px -10px rgba(0, 0, 0, 0.15)",
  cursor: "pointer",
  transition:
    "background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
  "&:hover": {
    bgcolor: ACCENT_COLORS[accent].light,
    borderColor: ACCENT_COLORS[accent].main,
    boxShadow: "0 8px 20px -8px rgba(0, 0, 0, 0.18)",
    transform: "translateY(-3px)",
  },
  "&:hover .contact-icon-circle": {
    bgcolor: ACCENT_COLORS[accent].main,
    color: "var(--white)",
  },
  "&:hover .contact-chevron": {
    color: ACCENT_COLORS[accent].main,
    transform: "translateX(3px)",
  },
});

const sectionCardSx = {
  flex: 1,
  width: "100%",
  boxShadow: "0 4px 20px -8px rgba(0, 0, 0, 0.06)",
  borderRadius: 3,
  bgcolor: "background.paper",
} as const;

export default function GetInTouch() {
  return (
    <Box component="section" sx={{ pb: { xs: 3, md: 6 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            alignItems: "stretch",
          }}
        >
          {/* Left: Get in Touch card */}
          <Box sx={{ ...sectionCardSx, p: { xs: 3, md: 4 } }}>
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: "var(--primary)",
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Get in Touch
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              We are always happy to connect with students, parents, teachers
              and partners.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {CONTACT_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Box key={item.label} sx={getContactCardSx(item.accent)}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        className="contact-icon-circle"
                        sx={getIconCircleSx(item.accent)}
                      >
                        <Icon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 700 }}
                        >
                          {item.label}
                        </Typography>
                        {item.value.split("\n").map((line) => (
                          <Typography
                            key={line}
                            variant="body2"
                            sx={{ color: "text.secondary" }}
                          >
                            {line}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    <ChevronRightIcon
                      className="contact-chevron"
                      sx={{
                        color: "text.disabled",
                        transition: "transform 0.25s ease, color 0.25s ease",
                        flexShrink: 0,
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Right: Map */}
          <Box
            sx={{
              ...sectionCardSx,
              overflow: "hidden",
              minHeight: { xs: 320, md: "auto" },
            }}
          >
            <Box
              component="iframe"
              src="https://www.google.com/maps?q=B4,+Lumiers+Enclave,+Giri+Nagar+Main+Road,+Ramapuram,+Chennai+600089&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Drill Daily Location"
              sx={{
                border: 0,
                width: "100%",
                height: "100%",
                minHeight: 340,
                display: "block",
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
