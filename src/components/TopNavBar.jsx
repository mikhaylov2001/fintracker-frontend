import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Tooltip } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";
import { bankingColors as colors } from "../styles/bankingTokens";

export default function TopNavBar({ onMenuClick }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: alpha(colors.card, 0.86),
        color: colors.text,
        backdropFilter: "blur(10px)",
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        {!isDesktop ? (
          <Tooltip title="Меню" placement="bottom">
            <IconButton onClick={onMenuClick} aria-label="Открыть меню" sx={{ color: colors.text }}>
              <MenuIcon />
            </IconButton>
          </Tooltip>
        ) : null}

        <Typography
          onClick={() => navigate("/")}
          sx={{
            flexGrow: 1,
            fontWeight: 950,
            cursor: "pointer",
            userSelect: "none",
            letterSpacing: -0.2,
          }}
        >
          FinTrackerPro
        </Typography>

        {/* пусто намеренно */}
      </Toolbar>
    </AppBar>
  );
}
