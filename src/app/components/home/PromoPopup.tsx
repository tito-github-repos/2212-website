"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Box, Modal, Fade, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

/**
 * Path to the banner image.
 * File location: public/img/promo-banner.webp
 */
const BANNER_IMAGE = "/img/promo-banner.webp";

export default function PromoPopup() {
  const [open, setOpen] = useState(false);

  // Show automatically when the home page loads
  useEffect(() => {
    setOpen(true);
  }, []);

  const handleClose = () => setOpen(false);
  const handleOpen = () => setOpen(true);

  return (
    <>
      <div>
        {/* ── Popup ── */}
        <Modal
          open={open}
          onClose={handleClose}
          closeAfterTransition
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
          }}
        >
          <Fade in={open}>
            <Box
              sx={{
                position: "relative",
                maxWidth: 820,
                width: "100%",
                outline: "none",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                background: "#fff",
              }}
            >
              {/* Close button */}
              <IconButton
                onClick={handleClose}
                aria-label="Close promo popup"
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 2,
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  "&:hover": {
                    background: "rgba(0,0,0,0.75)",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              {/* Banner image — natural aspect ratio, no letterboxing */}
              <Image
                src={BANNER_IMAGE}
                alt="Promotional banner"
                width={1944}
                height={974}
                style={{ width: "100%", height: "auto", display: "block" }}
                sizes="(max-width: 820px) 100vw, 820px"
                priority
              />
            </Box>
          </Fade>
        </Modal>

        {/* ── Floating icon to reopen the popup ── */}
        <Tooltip title="Announcement" placement="left">
          <IconButton
            onClick={handleOpen}
            aria-label="Open promo popup"
            sx={{
              position: "fixed",
              bottom: { xs: 20, md: 32 },
              right: { xs: 20, md: 32 },
              zIndex: 1300,
              width: { xs: 52, md: 60 },
              height: { xs: 52, md: 60 },
              background: "#16a34a",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(22,163,74,0.45)",
              "&:hover": {
                background: "#15803d",
              },
            }}
          >
            <CampaignRoundedIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
          </IconButton>
        </Tooltip>
      </div>
    </>
  );
}
