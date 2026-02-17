import React from "react";
import { AppBar, Toolbar, Typography, IconButton, Tooltip } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import { useNavigate } from "react-router-dom";

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
        bgcolor: "#FFFFFF",
        color: "#0F172A",
        borderBottom: "1px solid rgba(15,23,42,0.12)",
      }}
    >
      <Toolbar sx={{ minHeight: 64, gap: 1 }}>
        {!isDesktop ? (
          <Tooltip title="Меню" placement="bottom">
            <IconButton onClick={onMenuClick} aria-label="Открыть меню">
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

        {/* намеренно пусто: без “Дашборд/Доходы/Расходы/Имя/Выйти” */}
      </Toolbar>
    </AppBar>
  );
}
