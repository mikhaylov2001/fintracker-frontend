import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Link as RouterLink, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { bankingColors as colors } from "../../styles/bankingTokens";

export default function LoginPage() {
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state && location.state.from) || { pathname: "/" };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitting) return;
      setError("");
      try {
        setSubmitting(true);
        await login(email.trim(), password);
      } catch (err) {
        setError(
          err?.message || "Не удалось войти. Проверьте логин и пароль."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [email, password, submitting, login]
  );

  // Если уже авторизованы — редирект, НО хук вызываем всегда выше
  useEffect(() => {
    // никаких действий тут не обязательно, главное — не вызывать хуки условно
  }, []);

  if (isAuthenticated && !authLoading) {
    return <Navigate to={from} replace />;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          bgcolor: "#020617",
          border: `1px solid ${alpha("#fff", 0.06)}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 980,
            color: colors.text,
            letterSpacing: -0.5,
            mb: 0.5,
          }}
        >
          Вход в аккаунт
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: alpha("#fff", 0.6), mb: 3, fontWeight: 600 }}
        >
          Введите email и пароль, чтобы продолжить
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon
                      fontSize="small"
                      sx={{ color: alpha("#fff", 0.7) }}
                    />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Пароль"
              type={showPass ? "text" : "password"}
              fullWidth
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon
                      fontSize="small"
                      sx={{ color: alpha("#fff", 0.7) }}
                    />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onClick={() => setShowPass((s) => !s)}
                      sx={{ color: alpha("#fff", 0.7) }}
                    >
                      {showPass ? (
                        <VisibilityOffOutlinedIcon fontSize="small" />
                      ) : (
                        <VisibilityOutlinedIcon fontSize="small" />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Typography
                variant="body2"
                sx={{
                  color: colors.danger,
                  fontWeight: 600,
                  mt: -0.5,
                }}
              >
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting || authLoading}
              sx={{
                mt: 1,
                borderRadius: 999,
                py: 1.1,
                fontWeight: 900,
                textTransform: "none",
                bgcolor: colors.primary,
                "&:hover": { bgcolor: "#16A34A" },
              }}
            >
              {submitting || authLoading ? (
                <CircularProgress size={22} sx={{ color: "#02120A" }} />
              ) : (
                "Войти"
              )}
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: alpha("#fff", 0.7),
            mt: 3,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Нет аккаунта?{" "}
          <Button
            component={RouterLink}
            to="/register"
            sx={{
              textTransform: "none",
              fontWeight: 900,
              color: colors.primary,
              px: 0.5,
            }}
          >
            Зарегистрироваться
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}
