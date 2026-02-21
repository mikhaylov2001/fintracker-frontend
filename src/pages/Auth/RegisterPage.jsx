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
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Link as RouterLink, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { bankingColors as colors } from "../../styles/bankingTokens";

export default function RegisterPage() {
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const from = (location.state && location.state.from) || { pathname: "/" };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitting) return;
      setError("");

      if (password !== password2) {
        setError("Пароли не совпадают");
        return;
      }

      try {
        setSubmitting(true);
        await register({
          firstName: firstName.trim(),
          email: email.trim(),
          password,
        });
      } catch (err) {
        setError(
          err?.message || "Не удалось зарегистрироваться. Попробуйте ещё раз."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [firstName, email, password, password2, register, submitting]
  );

  useEffect(() => {
    // хук вызывается всегда, логика редиректа ниже в раннем return
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
          maxWidth: 450,
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
          Регистрация
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: alpha("#fff", 0.6), mb: 3, fontWeight: 600 }}
        >
          Создайте аккаунт, чтобы отслеживать доходы и расходы
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2.2}>
            <TextField
              label="Имя"
              fullWidth
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineOutlinedIcon
                      fontSize="small"
                      sx={{ color: alpha("#fff", 0.7) }}
                    />
                  </InputAdornment>
                ),
              }}
            />

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
              autoComplete="new-password"
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

            <TextField
              label="Подтвердите пароль"
              type={showPass2 ? "text" : "password"}
              fullWidth
              required
              autoComplete="new-password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
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
                      onClick={() => setShowPass2((s) => !s)}
                      sx={{ color: alpha("#fff", 0.7) }}
                    >
                      {showPass2 ? (
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
                "Зарегистрироваться"
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
          Уже есть аккаунт?{" "}
          <Button
            component={RouterLink}
            to="/login"
            sx={{
              textTransform: "none",
              fontWeight: 900,
              color: colors.primary,
              px: 0.5,
            }}
          >
            Войти
          </Button>
        </Typography>
      </Paper>
    </Box>
  );
}
