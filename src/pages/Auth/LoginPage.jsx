import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Button, TextField, Typography, Paper, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const GOOGLE_CLIENT_ID =
  '1096583300191-ecs88krahb9drbhbs873ma4mieb7lihj.apps.googleusercontent.com';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [form, setForm] = useState({ userName: '', password: '' });
  const [error, setError] = useState('');
  const googleDivRef = useRef(null);

  const handleGoogleCallback = useCallback(
    async (response) => {
      try {
        setError('');
        await loginWithGoogle(response.credential);
        navigate('/dashboard');
      } catch (err) {
        console.error(err);
        setError('Ошибка входа через Google');
      }
    },
    [loginWithGoogle, navigate]
  );

  useEffect(() => {
    if (!window.google?.accounts?.id) return;
    if (!googleDivRef.current || googleDivRef.current.childElementCount > 0) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCallback,
    });

    window.google.accounts.id.renderButton(googleDivRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
    });
  }, [handleGoogleCallback]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ userName: form.userName, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Неверное имя пользователя или пароль');
    }
  };

  const handleGoToRegister = () => navigate('/register');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Вход в FinTrackerPro
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
            sx={{ mt: 3, mb: 2 }}
          >
            Войти
          </Button>
        </Box>

        <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
          <div ref={googleDivRef} />
        </Box>

        <Typography variant="body2" align="center">
          Нет аккаунта?{' '}
          <Link component="button" type="button" onClick={handleGoToRegister}>
            Зарегистрироваться
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;
