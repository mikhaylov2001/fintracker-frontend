// src/pages/Auth/LoginPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AppBackground from "../../layouts/AppBackground";

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com";

const GIS_SRC = "https://accounts.google.com/gsi/client";

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
  return "";
};

// аккуратное чтение ошибки с бэка
const mapApiError = (err, fallback) => {
  const data = err?.response?.data;
  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }
  if (err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return fallback;
};

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(true);

    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, isAuthenticated, loading, user } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const googleDivRef = useRef(null);
  const gisInitedRef = useRef(false);

  const afterLoginPath = location.state?.from?.pathname || "/";

  // живая валидация после первого касания
  useEffect(() => {
    setFieldErrors({
      email: touched.email ? validateEmail(form.email) : "",
      password: touched.password ? validatePassword(form.password) : "",
    });
  }, [form, touched]);

  const handleBlur = (field) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const isFormValid =
    !validateEmail(form.email) && !validatePassword(form.password);

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
        navigate(afterLoginPath, { replace: true });
      } catch (err) {
        console.error(err);
        const msg = mapApiError(err, "Ошибка входа через Google");
        setError(msg);
      }
    },
    [loginWithGoogle, navigate, afterLoginPath]
  );

  useEffect(() => {
    if (loading || isAuthenticated) return;

    let cancelled = false;

    (async () => {
      try {
        await loadGisScript();
        if (cancelled) return;

        if (!googleDivRef.current) return;
        if (!window.google?.accounts?.id) return;

        if (gisInitedRef.current) return;
        gisInitedRef.current = true;

        googleDivRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(googleDivRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
        });
      } catch (e) {
        console.error(e);
        setError("Не удалось загрузить Google вход. Проверьте настройки.");
      }
    })();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {}
    };
  }, [handleGoogleCallback, loading, isAuthenticated]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const emailErr = validateEmail(form.email);
    const passErr = validatePassword(form.password);
    if (emailErr || passErr) {
      setFieldErrors({ email: emailErr, password: passErr });
      return;
    }

    setError("");
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(afterLoginPath, { replace: true });
    } catch (err) {
      console.error(err);
      const msg = mapApiError(
        err,
        "Ошибка входа. Проверьте данные и попробуйте ещё раз"
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
          <Typography
            sx={{
              color: "rgba(255,255,255,0.92)",
              fontWeight: 950,
              fontSize: 22,
              lineHeight: 1.15,
            }}
          >
            Вход в ваш центр финансового контроля
          </Typography>
          <Typography
            sx={{
              mt: 0.8,
              color: "rgba(255,255,255,0.72)",
              fontSize: 13.5,
              lineHeight: 1.35,
            }}
          >
            Подключитесь к истории доходов, расходов и сбережений, чтобы видеть
            картину по месяцам и держать бюджет под контролем.
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
          <Typography
            sx={{
              color: "rgba(255,255,255,0.9)",
              fontWeight: 950,
              fontSize: 34,
              lineHeight: 1.1,
            }}
          >
            Вход в ваш центр финансового контроля
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              color: "rgba(255,255,255,0.72)",
              fontSize: 15,
              maxWidth: 420,
            }}
          >
            Подключитесь к истории доходов, расходов и сбережений, чтобы видеть
            картину по месяцам и держать бюджет под контролем.
          </Typography>
        </Box>

        {/* Card */}
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 4 },
            width: "100%",
            maxWidth: 420,
            mx: "auto",
            borderRadius: 5,
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,244,255,0.98))",
            boxShadow:
              "0 18px 45px rgba(15,23,42,0.42), 0 0 0 1px rgba(15,23,42,0.06)",
          }}
        >
          <Box sx={{ mb: 2.5, textAlign: "center" }}>
            <Typography
              component="h1"
              sx={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 0.3,
                color: "#111827",
              }}
            >
              Вход
            </Typography>
            <Typography
              sx={{
                mt: 0.8,
                fontSize: 13,
                color: "rgba(15,23,42,0.6)",
              }}
            >
              Войдите в аккаунт, чтобы продолжить.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
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
              helperText={fieldErrors.email}
              required
              autoComplete="email"
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
              helperText={fieldErrors.password}
              required
              autoComplete="current-password"
            />

            {/* Ссылка "Забыли пароль?" */}
            <Box
              sx={{
                mt: 1,
                mb: 0.5,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/forgot-password")}
                sx={{
                  fontSize: 13,
                  color: "rgba(15,23,42,0.7)",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Забыли пароль?
              </Link>
            </Box>

            {error && (
              <Typography color="error" variant="body2" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={!isFormValid}
              sx={{
                mt: 2,
                mb: 1.5,
                borderRadius: 999,
                py: 1.1,
                fontWeight: 800,
                textTransform: "none",
                fontSize: 15,
              }}
            >
              Войти
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
            <Typography
              variant="caption"
              sx={{ color: "rgba(15,23,42,0.5)", textTransform: "uppercase" }}
            >
              или
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(15,23,42,0.08)" }} />
          </Box>

          {/* Google */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 1.5 }}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 420,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div ref={googleDivRef} />
            </Box>
          </Box>

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 0.5, color: "rgba(15,23,42,0.7)" }}
          >
            Нет аккаунта?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/register")}
              sx={{ fontWeight: 600 }}
            >
              Зарегистрироваться
            </Link>
          </Typography>
        </Paper>
      </Box>
    </AppBackground>
  );
}
