// src/pages/Auth/ForgotPasswordPage.jsx
import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Link } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppBackground from "../../layouts/AppBackground";
import {
  authHeroSx,
  authPaperSx,
  authTitleSx,
  authSubtitleSx,
  authHeroTitleSx,
  authHeroTextSx,
  authPrimaryButtonSx,
} from "../../styles/authUi";

import { requestPasswordReset } from "../../api/passwordResetApi";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validateEmail = (v) => {
  if (!v.trim()) return "Введите email";
  if (!EMAIL_RE.test(v.trim())) return "Некорректный формат email";
  return "";
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    setFieldError(validateEmail(email));
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (touched) setFieldError(validateEmail(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    setFieldError(err);
    if (err) return;

    setLoading(true);
    setStatus("");

    try {
      await requestPasswordReset(email.trim());
      setStatus(
        "Если такой email существует, мы отправили инструкцию по восстановлению пароля."
      );
    } catch {
      setStatus(
        "Если такой email существует, мы отправили инструкцию по восстановлению пароля."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground
      sx={{
        minHeight: "100vh",
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
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            ...authHeroSx,
            p: 4,
          }}
        >
          <Typography sx={{ ...authHeroTitleSx, fontSize: 32, lineHeight: 1.1 }}>
            Восстановление доступа к FinTracker
          </Typography>
          <Typography
            sx={{
              mt: 1.25,
              ...authHeroTextSx,
              fontSize: 15,
              maxWidth: 420,
            }}
          >
            Если вы забыли пароль, мы отправим ссылку для его сброса на ваш email.
          </Typography>
        </Box>

        <Paper elevation={0} sx={authPaperSx}>
          <Box sx={{ mb: 2.5, textAlign: "center" }}>
            <Typography component="h1" sx={authTitleSx}>
              Восстановление пароля
            </Typography>
            <Typography
              sx={authSubtitleSx}
            >
              Укажите email, на который зарегистрирован аккаунт.
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 0.5 }}>
            <TextField
              margin="dense"
              fullWidth
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(fieldError)}
              helperText={fieldError}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading || !!validateEmail(email)}
              sx={{ ...authPrimaryButtonSx, textTransform: "none", fontSize: 15 }}
            >
              {loading ? "Отправляем..." : "Отправить ссылку"}
            </Button>
          </Box>

          {status && (
            <Typography
              variant="body2"
              sx={{ mt: 1, ...authSubtitleSx }}
            >
              {status}
            </Typography>
          )}

          <Typography
            variant="body2"
            align="center"
            sx={{ mt: 2, ...authSubtitleSx }}
          >
            Вспомнили пароль?{" "}
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/login")}
              sx={{ fontWeight: 600 }}
            >
              Вернуться ко входу
            </Link>
          </Typography>
        </Paper>
      </Box>
    </AppBackground>
  );
}
