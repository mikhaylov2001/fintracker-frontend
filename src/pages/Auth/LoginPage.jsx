import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({ userName: "", password: "" });
  const [error, setError] = useState("");
  const googleDivRef = useRef(null);

  const afterLoginPath = location.state?.from?.pathname || "/";

  const handleGoogleCallback = useCallback(
    async (response) => {
      try {
        setError("");
        await loginWithGoogle(response.credential);
        navigate(afterLoginPath, { replace: true });
      } catch (err) {
        console.error(err);
        setError("Ошибка входа через Google");
      }
    },
    [loginWithGoogle, navigate, afterLoginPath]
  );

  useEffect(() => {
    if (!window.google?.accounts?.id) return;
    if (!googleDivRef.current || googleDivRef.current.childElementCount > 0) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
    });

    window.google.accounts.id.renderButton(googleDivRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
    });
  }, [handleGoogleCallback]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login({ userName: form.userName, password: form.password });
      navigate(afterLoginPath, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Неверное имя пользователя или пароль");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: { xs: 3, md: 0 },
        bgcolor: "#0B1220",
        backgroundImage:
          "radial-gradient(1200px 600px at 15% 10%, rgba(34,197,94,0.18), transparent 60%)," +
          "radial-gradient(900px 500px at 85% 20%, rgba(99,102,241,0.22), transparent 55%)," +
          "radial-gradient(800px 500px at 50% 90%, rgba(249,115,22,0.14), transparent 55%)," +
          "linear-gradient(180deg, #0B1220 0%, #070B14 100%)",
      }}
    >
      {/* тонкий паттерн-сетка поверх градиента */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.22,
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          mixBlendMode: "soft-light",
        }}
      />

      {/* blurred-circles */}
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
            filter: "blur(38px)",
            opacity: 0.75,
          },
          "&:before": {
            left: { xs: -80, md: -120 },
            top: { xs: -80, md: -120 },
            background:
              "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.55), rgba(34,197,94,0) 65%)",
          },
          "&:after": {
            right: { xs: -90, md: -130 },
            bottom: { xs: -90, md: -130 },
            background:
              "radial-gradient(circle at 30% 30%, rgba(99,102,241,0.6), rgba(99,102,241,0) 65%)",
          },
        }}
      />

      <Box
        sx={{
          width: "100%",
          maxWidth: 980,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.25fr 0.9fr" },
          gap: { xs: 2, md: 3 },
          alignItems: "stretch",
          position: "relative",
          zIndex: 1,
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
            FinTrackerPro
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              color: "rgba(255,255,255,0.72)",
              fontSize: 13.5,
              lineHeight: 1.35,
            }}
          >
            Доходы, расходы и норма сбережений — в одном месте.
          </Typography>

          <Box
            sx={{
              mt: 1.5,
              borderRadius: 4,
              p: 1.6,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(99,102,241,0.12) 55%, rgba(249,115,22,0.10) 100%)",
            }}
          >
            <Typography
              sx={{ color: "rgba(255,255,255,0.82)", fontWeight: 850, fontSize: 13 }}
            >
              Подсказка
            </Typography>
            <Typography
              sx={{ mt: 0.35, color: "rgba(255,255,255,0.68)", fontSize: 12.5 }}
            >
              Вход по Google или по логину/паролю.
            </Typography>
          </Box>
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
            FinTrackerPro
          </Typography>

          <Typography
            sx={{
              mt: 1.25,
              color: "rgba(255,255,255,0.72)",
              fontSize: 15,
              maxWidth: 420,
            }}
          >
            Доходы, расходы и норма сбережений — в одном месте. Отслеживай
            динамику по месяцам и держи финансы под контролем.
          </Typography>

          <Box
            sx={{
              mt: 3,
              borderRadius: 4,
              p: 2.25,
              border: "1px solid rgba(255,255,255,0.08)",
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(99,102,241,0.12) 55%, rgba(249,115,22,0.10) 100%)",
            }}
          >
            <Typography
              sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 850 }}
            >
              Подсказка
            </Typography>
            <Typography
              sx={{ mt: 0.5, color: "rgba(255,255,255,0.7)", fontSize: 13 }}
            >
              Можно войти через Google или по логину/паролю.
            </Typography>
          </Box>
        </Box>

        {/* Форма */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: "100%",
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            align="center"
            sx={{ fontWeight: 950 }}
          >
            Вход
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              fullWidth
              label="Имя пользователя"
              name="userName"
              value={form.userName}
              onChange={handleChange}
              required
              autoComplete="username"
            />
            <TextField
              margin="normal"
              fullWidth
              label="Пароль"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />

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
              sx={{ mt: 3, mb: 2, borderRadius: 999, py: 1.1, fontWeight: 800 }}
            >
              Войти
            </Button>
          </Box>

          <Box sx={{ mt: 2, mb: 2, textAlign: "center" }}>
            <div ref={googleDivRef} />
          </Box>

          <Typography variant="body2" align="center">
            Нет аккаунта?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/register")}
            >
              Зарегистрироваться
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
