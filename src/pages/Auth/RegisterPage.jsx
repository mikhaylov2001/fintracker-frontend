import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AppBackground from "../../layouts/AppBackground";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import {
  authPaperSx,
  authTitleSx,
  authSubtitleSx,
  authTextFieldSx,
  authSubmitBtnSx,
  authLinkSx,
  authFooterTextSx,
  authErrorSx,
  authDividerLabelSx,
  authHeroTitleSx,
  authHeroTextSx,
} from "../../styles/authFormStyles";

// ===== валидация =====
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validateEmail = (v) => {
  if (!v.trim()) return "Введите email";
  if (!EMAIL_RE.test(v.trim())) return "Некорректный формат email";
  return "";
};

const validatePassword = (v) => {
  if (!v) return "Введите пароль";
  if (v.length < 8) return "Минимум 8 символов";
  if (!/[A-ZА-ЯЁ]/.test(v)) return "Нужна хотя бы одна заглавная буква";
  if (!/[a-zа-яё]/.test(v)) return "Нужна хотя бы одна строчная буква";
  if (!/[0-9]/.test(v)) return "Нужна хотя бы одна цифра";
  return "";
};

const validateName = (v, label) => {
  if (!v.trim()) return `Введите ${label}`;
  if (v.trim().length < 2) return `${label} слишком короткое`;
  return "";
};

// аккуратное чтение ошибки с бэка
const mapApiError = (err, fallback) => {
  const data = err?.data ?? err?.response?.data;
  if (data && typeof data === "object") {
    const msg = data.message || data.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (typeof data === "string" && data.trim()) return data.trim();
  if (err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return fallback;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isAuthenticated, loading, user } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    email: false,
    password: false,
  });

  // живая валидация после первого касания
  useEffect(() => {
    setFieldErrors({
      firstName: touched.firstName
        ? validateName(form.firstName, "имя")
        : "",
      lastName: touched.lastName
        ? validateName(form.lastName, "фамилию")
        : "",
      email: touched.email ? validateEmail(form.email) : "",
      password: touched.password ? validatePassword(form.password) : "",
    });
  }, [form, touched]);

  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const isFormValid =
    !validateName(form.firstName, "имя") &&
    !validateName(form.lastName, "фамилию") &&
    !validateEmail(form.email) &&
    !validatePassword(form.password);

  const handleGoogleCallback = useCallback(
    async (response) => {
      try {
        setError("");

        const idToken = response?.credential;
        if (!idToken) {
          setError("Google не вернул токен. Попробуйте ещё раз.");
          return;
        }

        if (typeof loginWithGoogle !== "function") {
          setError("Google вход не настроен (loginWithGoogle отсутствует).");
          return;
        }

        await loginWithGoogle(idToken);
        navigate("/", { replace: true });
      } catch (err) {
        console.error(err);
        const msg = mapApiError(err, "Ошибка регистрации через Google");
        setError(msg);
      }
    },
    [loginWithGoogle, navigate]
  );

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
    });

    const fnErr = validateName(form.firstName, "имя");
    const lnErr = validateName(form.lastName, "фамилию");
    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);

    if (fnErr || lnErr || emailErr || passErr) {
      setFieldErrors({
        firstName: fnErr,
        lastName: lnErr,
        email: emailErr,
        password: passErr,
      });
      return;
    }

    setError("");
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      console.error(err);
      const msg = mapApiError(
        err,
        "Ошибка при регистрации. Попробуйте ещё раз."
      );
      setError(msg);
    }
  };

  if (!loading && isAuthenticated) {
    const userName = user?.userName;
    return (
      <Navigate
        to={userName ? `/u/${encodeURIComponent(userName)}` : "/u/me"}
        replace
      />
    );
  }

  return (
    <AppBackground
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 2,
        pb: "calc(16px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.25fr 0.9fr" },
          gap: { xs: 2, md: 3 },
          alignItems: "stretch",
        }}
      >
        {/* Mobile hero */}
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            borderRadius: 5,
            p: 2.5,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography sx={{ ...authHeroTitleSx, fontSize: 22, lineHeight: 1.15 }}>
            Начните путь к осознанным финансам
          </Typography>
          <Typography sx={{ ...authHeroTextSx, mt: 0.8, fontSize: 14, lineHeight: 1.4 }}>
            Создайте аккаунт, задайте цели и отслеживайте, сколько вы
            зарабатываете, тратите и откладываете каждый месяц.
          </Typography>
        </Box>

        {/* Desktop hero */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            borderRadius: 5,
            p: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography sx={{ ...authHeroTitleSx, fontSize: 34, lineHeight: 1.1 }}>
            Начните путь к осознанным финансам
          </Typography>
          <Typography sx={{ ...authHeroTextSx, mt: 1.25, fontSize: 15, maxWidth: 420 }}>
            Создайте аккаунт, задайте цели и отслеживайте, сколько вы
            зарабатываете, тратите и откладываете каждый месяц.
          </Typography>
        </Box>

        {/* Card */}
        <Paper elevation={0} className="auth-card" sx={authPaperSx}>
          <Box sx={{ mb: 2.5, textAlign: "center" }}>
            <Typography component="h1" sx={authTitleSx}>
              Регистрация
            </Typography>
            <Typography sx={authSubtitleSx}>
              Создайте аккаунт, чтобы отслеживать финансы.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <TextField
              margin="dense"
              fullWidth
              label="Имя"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              onBlur={handleBlur("firstName")}
              error={Boolean(fieldErrors.firstName)}
              helperText={fieldErrors.firstName}
              required
              autoComplete="given-name"
              sx={authTextFieldSx}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Фамилия"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              onBlur={handleBlur("lastName")}
              error={Boolean(fieldErrors.lastName)}
              helperText={fieldErrors.lastName}
              required
              autoComplete="family-name"
              sx={authTextFieldSx}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur("email")}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email || "Например: user@example.com"}
              required
              autoComplete="email"
              sx={authTextFieldSx}
            />
            <TextField
              margin="dense"
              fullWidth
              label="Пароль"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur("password")}
              error={Boolean(fieldErrors.password)}
              helperText={
                fieldErrors.password ||
                "Мин. 8 символов, заглавная, строчная и цифра"
              }
              required
              autoComplete="new-password"
              sx={authTextFieldSx}
            />

            {error && (
              <Typography component="p" sx={authErrorSx}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disableElevation
              disabled={!isFormValid}
              sx={authSubmitBtnSx}
            >
              Зарегистрироваться
            </Button>
          </Box>

          <Box
            sx={{
              mt: 1.5,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(15,23,42,0.08)" }} />
            <Typography variant="caption" sx={authDividerLabelSx}>
              или
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(15,23,42,0.08)" }} />
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <GoogleSignInButton
              label="Зарегистрироваться через Google"
              onCredential={handleGoogleCallback}
              disabled={loading}
            />
          </Box>

          <Typography variant="body2" align="center" sx={authFooterTextSx}>
            Уже есть аккаунт?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/login")}
              sx={authLinkSx}
            >
              Войти
            </Link>
          </Typography>
        </Paper>
      </Box>
    </AppBackground>
  );
}
