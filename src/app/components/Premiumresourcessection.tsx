"use client";

import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

const products = [
  {
    icon: DescriptionOutlinedIcon,
    iconBg: "#E9F9EE",
    iconColor: "#19B44A",
    title: "Worksheets Download",
    subtitle: "Premium Worksheets",
    price: "₹12",
  },
  {
    icon: MenuBookOutlinedIcon,
    iconBg: "#E6F7F9",
    iconColor: "#0FA9B8",
    title: "Hard Copy Book",
    subtitle: "2212 Practice Book",
    price: "₹212",
  },
  {
    icon: EmojiEventsOutlinedIcon,
    iconBg: "#FDF3DC",
    iconColor: "#E8A800",
    title: "Competitions",
    subtitle: "2212 Challenge Exams",
    price: "₹2212",
  },
];

export default function PremiumResourcesSection() {
  return (
    <Box
      sx={{
        py: { xs: 4, md: 6 },
        bgcolor: "#fff",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Stack spacing={1.5} sx={{ textAlign: "center", alignItems: "center", mb: { xs: 3, md: 5 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "#111",
              fontSize: { xs: "1.6rem", sm: "1.9rem", md: "2.2rem" },
            }}
          >
            Premium Resources & Products
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: "0.9rem", md: "1rem" },
              maxWidth: 560,
              mx: "auto",
              textAlign: "center",
              color: "#6B7280",
            }}
          >
            Quality resources to help you practice better and perform your
            best.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: { xs: 3, md: 4 },
          }}
        >
          {products.map(
            ({ icon: Icon, iconBg, iconColor, title, subtitle, price }) => (
              <Box
                key={title}
                sx={{
                  width: { xs: "100%", sm: "calc(33.333% - 22px)" },
                  maxWidth: 360,
                  minWidth: 260,
                }}
              >
                <Box
                  sx={{
                    height: "100%",
                    border: "1px solid #ECECEC",
                    borderRadius: 3,
                    p: { xs: 2.5, md: 3 },
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                    transition: "box-shadow 0.2s ease, transform 0.2s ease",
                    "&:hover": {
                      boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        minWidth: 52,
                        borderRadius: "50%",
                        bgcolor: iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon sx={{ color: iconColor, fontSize: 28 }} />
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: "0.95rem", md: "1rem" },
                          color: "#111",
                        }}
                      >
                        {title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: { xs: "0.75rem", md: "0.8rem" } }}
                      >
                        {subtitle}
                      </Typography>
                    </Box>
                  </Stack>

                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "1.4rem", md: "1.6rem" },
                      color: "#111",
                      textAlign: "center",
                    }}
                  >
                    {price}
                  </Typography>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      bgcolor: "#19B44A",
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      py: 1,
                      mt: "auto",
                      "&:hover": { bgcolor: "#12953c" },
                    }}
                  >
                    Pay Now
                  </Button>
                </Box>
              </Box>
            )
          )}
        </Box>
      </Container>
    </Box>
  );
}