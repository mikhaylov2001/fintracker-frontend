import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  List,
  ListSubheader,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
  Divider,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import CurrencyRubleOutlinedIcon from '@mui/icons-material/CurrencyRubleOutlined';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAuth } from '../../contexts/AuthContext';
import { bankingColors as colors, surfaceOutlinedSx } from '../../styles/bankingTokens';

const LS = {
  currency: 'ft.settings.currency',
  hideAmounts: 'ft.settings.hideAmounts',
  compactNumbers: 'ft.settings.compactNumbers',
};



const downloadJson = (filename, data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export default function SettingsPage() {
  const { user, logout } = useAuth(); // если logout нет в контексте — см. ниже примечание
  const userId = user?.id;

  const [currency, setCurrency] = useState('RUB');
  const [hideAmounts, setHideAmounts] = useState(false);
  const [compactNumbers, setCompactNumbers] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  useEffect(() => {
    const c = localStorage.getItem(LS.currency);
    const h = localStorage.getItem(LS.hideAmounts);
    const k = localStorage.getItem(LS.compactNumbers);

    if (c) setCurrency(c);
    if (h != null) setHideAmounts(h === '1');
    if (k != null) setCompactNumbers(k === '1');
  }, []);

  useEffect(() => {
    localStorage.setItem(LS.currency, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(LS.hideAmounts, hideAmounts ? '1' : '0');
  }, [hideAmounts]);

  useEffect(() => {
    localStorage.setItem(LS.compactNumbers, compactNumbers ? '1' : '0');
  }, [compactNumbers]);

  const handleExport = useCallback(() => {
    const raw = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      raw[key] = localStorage.getItem(key);
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      user: { id: userId ?? null, email: user?.email ?? null, username: user?.username ?? null },
      settings: { currency, hideAmounts, compactNumbers },
      localStorage: raw,
    };

    downloadJson(`fintracker-export-${new Date().toISOString().slice(0, 10)}.json`, payload);
    setSnack({ open: true, severity: 'success', message: 'Экспорт готов (JSON скачан).' });
  }, [userId, user?.email, user?.username, currency, hideAmounts, compactNumbers]);

  const handleResetLocal = useCallback(() => {
    Object.values(LS).forEach((k) => localStorage.removeItem(k));

    setCurrency('RUB');
    setHideAmounts(false);
    setCompactNumbers(true);

    setConfirmOpen(false);
    setSnack({ open: true, severity: 'info', message: 'Локальные настройки сброшены.' });
  }, []);

  const handleLogout = useCallback(async () => {
    if (typeof logout !== 'function') {
      setSnack({
        open: true,
        severity: 'error',
        message: 'logout() не найден в AuthContext. Добавь его или замени обработчик.',
      });
      return;
    }
    await logout();
  }, [logout]);

  const PageWrap = useCallback(
    ({ children }) => (
      <Box
        sx={{
          width: '100%',
          mx: 'auto',
          px: { xs: 2, md: 3, lg: 4 },
          maxWidth: { xs: '100%', sm: 720, md: 1040, lg: 1240, xl: 1400 },
        }}
      >
        {children}
      </Box>
    ),
    []
  );

  const sectionSx = useMemo(
    () => ({
      ...surfaceOutlinedSx,
      p: { xs: 1.25, md: 1.75 },
      borderColor: alpha('#fff', 0.10),
      bgcolor: alpha(colors.card2, 0.70),
    }),
    []
  );

  return (
    <PageWrap>
      {/* Header */}
      <Box sx={{ mb: { xs: 2.5, md: 3 }, pt: { xs: 1, md: 1.5 } }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={{
              width: { xs: 40, md: 46 },
              height: { xs: 40, md: 46 },
              borderRadius: 3,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha(colors.primary, 0.14),
              border: `1px solid ${alpha(colors.primary, 0.22)}`,
            }}
          >
            <SettingsOutlinedIcon sx={{ color: alpha('#FFFFFF', 0.92) }} />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 980,
                color: colors.text,
                letterSpacing: -0.35,
                lineHeight: 1.05,
                fontSize: { xs: '1.35rem', sm: '1.55rem', md: '1.8rem' },
              }}
            >
              Настройки
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7 }}>
              <Chip
                size="small"
                label={user?.email || user?.username || 'Гость'}
                sx={{
                  fontWeight: 900,
                  borderRadius: 999,
                  bgcolor: alpha('#fff', 0.08),
                  color: alpha('#fff', 0.85),
                }}
              />
              {userId ? (
                <Chip
                  size="small"
                  label={`id: ${userId}`}
                  sx={{
                    fontWeight: 900,
                    borderRadius: 999,
                    bgcolor: alpha('#fff', 0.06),
                    color: alpha('#fff', 0.70),
                  }}
                />
              ) : null}
            </Stack>
          </Box>
        </Stack>
      </Box>

      <Stack spacing={{ xs: 2, md: 2.25 }}>
        {/* Account */}
        <Box sx={sectionSx}>
          <List
            disablePadding
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: 'transparent',
                  color: alpha('#fff', 0.75),
                  fontWeight: 950,
                  letterSpacing: 0.5,
                  px: 0,
                }}
              >
                Аккаунт
              </ListSubheader>
            }
          >
            <ListItem disableGutters sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40, color: alpha('#fff', 0.82) }}>
                <AccountCircleOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary={user?.email || user?.username || 'Не авторизован'}
                secondary={user?.email && user?.username ? user.username : ' '}
                primaryTypographyProps={{ fontWeight: 950, color: colors.text }}
                secondaryTypographyProps={{ color: alpha('#fff', 0.6), fontWeight: 700 }}
              />
            </ListItem>

            <Divider sx={{ borderColor: alpha('#fff', 0.08) }} />

            <ListItem disableGutters sx={{ px: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleLogout}
                startIcon={<LogoutOutlinedIcon />}
                sx={{
                  borderRadius: 3,
                  py: 1.15,
                  fontWeight: 950,
                  textTransform: 'none',
                  bgcolor: alpha('#fff', 0.10),
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: alpha('#fff', 0.16), boxShadow: 'none' },
                }}
              >
                Выйти
              </Button>
            </ListItem>
          </List>
        </Box>

        {/* UI */}
        <Box sx={sectionSx}>
          <List
            disablePadding
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: 'transparent',
                  color: alpha('#fff', 0.75),
                  fontWeight: 950,
                  letterSpacing: 0.5,
                  px: 0,
                }}
              >
                Интерфейс
              </ListSubheader>
            }
          >
            <ListItemButton
              disableGutters
              sx={{ px: 0, borderRadius: 2 }}
              onClick={() => setHideAmounts((v) => !v)}
            >
              <ListItemIcon sx={{ minWidth: 40, color: alpha('#fff', 0.82) }}>
                <PaletteOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Скрывать суммы"
                secondary="Полезно, если показываешь экран кому-то рядом"
                primaryTypographyProps={{ fontWeight: 950, color: colors.text }}
                secondaryTypographyProps={{ color: alpha('#fff', 0.6), fontWeight: 700 }}
              />
              <Switch checked={hideAmounts} onChange={(e) => setHideAmounts(e.target.checked)} />
            </ListItemButton>

            <Divider sx={{ borderColor: alpha('#fff', 0.08), my: 0.5 }} />

            <ListItemButton
              disableGutters
              sx={{ px: 0, borderRadius: 2 }}
              onClick={() => setCompactNumbers((v) => !v)}
            >
              <ListItemIcon sx={{ minWidth: 40, color: alpha('#fff', 0.82) }}>
                <PaletteOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Компактные числа (к/м)"
                secondary="Удобнее на мобильном и в графиках"
                primaryTypographyProps={{ fontWeight: 950, color: colors.text }}
                secondaryTypographyProps={{ color: alpha('#fff', 0.6), fontWeight: 700 }}
              />
              <Switch checked={compactNumbers} onChange={(e) => setCompactNumbers(e.target.checked)} />
            </ListItemButton>
          </List>
        </Box>

        {/* Currency */}
        <Box sx={sectionSx}>
          <List
            disablePadding
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: 'transparent',
                  color: alpha('#fff', 0.75),
                  fontWeight: 950,
                  letterSpacing: 0.5,
                  px: 0,
                }}
              >
                Валюта
              </ListSubheader>
            }
          >
            <ListItem disableGutters sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40, color: alpha('#fff', 0.82) }}>
                <CurrencyRubleOutlinedIcon />
              </ListItemIcon>

              <Box sx={{ width: '100%' }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="currency-label">Валюта</InputLabel>
                  <Select
                    labelId="currency-label"
                    value={currency}
                    label="Валюта"
                    onChange={(e) => setCurrency(e.target.value)}
                    sx={{
                      borderRadius: 3,
                      color: '#fff',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#fff', 0.14) },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#fff', 0.22) },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(colors.primary, 0.55) },
                      '.MuiSvgIcon-root': { color: alpha('#fff', 0.8) },
                    }}
                  >
                    <MenuItem value="RUB">RUB — ₽</MenuItem>
                    <MenuItem value="USD">USD — $</MenuItem>
                    <MenuItem value="EUR">EUR — €</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: alpha('#fff', 0.6), fontWeight: 700 }}>
                  Пока это настройка интерфейса; если нужно — сделаем конвертацию/мультивалютность.
                </Typography>
              </Box>
            </ListItem>
          </List>
        </Box>

        {/* Data */}
        <Box sx={sectionSx}>
          <List
            disablePadding
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: 'transparent',
                  color: alpha('#fff', 0.75),
                  fontWeight: 950,
                  letterSpacing: 0.5,
                  px: 0,
                }}
              >
                Данные
              </ListSubheader>
            }
          >
            <ListItem disableGutters sx={{ px: 0 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleExport}
                startIcon={<CloudDownloadOutlinedIcon />}
                sx={{
                  borderRadius: 3,
                  py: 1.15,
                  fontWeight: 950,
                  textTransform: 'none',
                  bgcolor: alpha(colors.primary, 0.18),
                  color: '#fff',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: alpha(colors.primary, 0.26), boxShadow: 'none' },
                }}
              >
                Экспорт (JSON)
              </Button>
            </ListItem>

            <Divider sx={{ borderColor: alpha('#fff', 0.08), my: 1 }} />

            <ListItem disableGutters sx={{ px: 0 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setConfirmOpen(true)}
                startIcon={<DeleteOutlineOutlinedIcon />}
                sx={{
                  borderRadius: 3,
                  py: 1.15,
                  fontWeight: 950,
                  textTransform: 'none',
                  borderColor: alpha('#fff', 0.16),
                  color: alpha('#fff', 0.92),
                  '&:hover': { borderColor: alpha('#fff', 0.26), bgcolor: alpha('#fff', 0.04) },
                }}
              >
                Сбросить локальные настройки
              </Button>
            </ListItem>

            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: alpha('#fff', 0.55), fontWeight: 700 }}>
              Это не удалит транзакции на сервере — только настройки в браузере.
            </Typography>
          </List>
        </Box>

        {/* About */}
        <Box sx={sectionSx}>
          <List
            disablePadding
            subheader={
              <ListSubheader
                component="div"
                sx={{
                  bgcolor: 'transparent',
                  color: alpha('#fff', 0.75),
                  fontWeight: 950,
                  letterSpacing: 0.5,
                  px: 0,
                }}
              >
                О приложении
              </ListSubheader>
            }
          >
            <ListItem disableGutters sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 40, color: alpha('#fff', 0.82) }}>
                <InfoOutlinedIcon />
              </ListItemIcon>
              <ListItemText
                primary="Fintracker"
                secondary={`Версия: ${process.env.REACT_APP_VERSION || '—'}`}
                primaryTypographyProps={{ fontWeight: 950, color: colors.text }}
                secondaryTypographyProps={{ color: alpha('#fff', 0.6), fontWeight: 700 }}
              />
            </ListItem>
          </List>
        </Box>
      </Stack>

      {/* Confirm reset */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Сбросить локальные настройки?</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: alpha('#000', 0.75) }}>
            Будут сброшены: валюта, “скрывать суммы”, “компактные числа”.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleResetLocal}>
            Сбросить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </PageWrap>
  );
}
