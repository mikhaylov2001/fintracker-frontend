import React from "react";
import { Box } from "@mui/material";

export default function AppBackground({ children, sx }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#0A0E1A",
        backgroundImage:
          "radial-gradient(1100px 550px at 12% 8%, rgba(124,92,255,0.18), transparent 62%)," +
          "radial-gradient(900px 500px at 88% 15%, rgba(47,231,161,0.14), transparent 60%)," +
          "radial-gradient(800px 500px at 50% 95%, rgba(109,168,255,0.10), transparent 58%)," +
          "linear-gradient(180deg, #0A0E1A 0%, #060A14 100%)",
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.15,
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.16) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(148,163,184,0.16) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
          mixBlendMode: "soft-light",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          "&:before, &:after": {
            content: '""',
            position: "absolute",
            width: { xs: 240, sm: 320, md: 420 },
            height: { xs: 240, sm: 320, md: 420 },
            borderRadius: 999,
            filter: "blur(40px)",
            opacity: 0.72,
          },
          "&:before": {
            left: { xs: -80, md: -120 },
            top: { xs: -80, md: -120 },
            background:
              "radial-gradient(circle at 30% 30%, rgba(124,92,255,0.45), rgba(124,92,255,0) 68%)",
          },
          "&:after": {
            right: { xs: -90, md: -130 },
            bottom: { xs: -90, md: -130 },
            background:
              "radial-gradient(circle at 30% 30%, rgba(47,231,161,0.40), rgba(47,231,161,0) 68%)",
          },
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1, width: "100%" }}>
        {children}
      </Box>
    </Box>
  );
}
