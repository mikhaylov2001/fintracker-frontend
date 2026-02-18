import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Stack,
  Tabs,
  Tab,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Divider,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import CurrencyRubleOutlinedIcon from '@mui/icons-material/CurrencyRubleOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import { useAuth } from '../../contexts/AuthContext';
import { bankingColors as colors } from '../../styles/bankingTokens';

const LS = {
  currency: 'ft.settings.currency',
  hideAmounts: 'ft.settings.hideAmounts',
};

const PageWrap = ({ children }) => (
  <Box
    sx={{
      width: '100%',
      mx: 'auto',
      maxWidth: { xs: '100%', sm: 720, md: 900, lg: 1040 },
    }}
  >
    {children}
  </Box>
);

const SectionTitle = ({ children }) => (
  <Typography
    sx={{
      fontSize: { xs: 13, md: 14 },
      fontWeight: 950,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: alpha('#fff', 0.55),
      mb: 1.5,
      mt: 3,
    }}
  >
    {children}
  </Typography>
);

const RowItem = ({ children, noDivider }) => (
  <>
    <Box
      sx={{
        py: { xs: 2, md: 2.25 },
        px: { xs: 2, md: 3 },
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: 'transparent',
      }}
    >
      {children}
    </Box>
    {!noDivider && <Divider sx={{ borderColor: alpha('#fff', 0.08) }} />}
  </>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const userId = user?.id;

  const [tab, setTab] = useState(0);

  // Интерфейс
  const [currency, setCurrency] = useState('RUB');
  const [hideAmounts, setHideAmounts] = useState(false);

  // Диалоги
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);

  // Форма редактирования имени
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  // Форма смены email
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // Форма смены пароля
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Форма удаления данных
  const [deleteMonth, setDeleteMonth] = useState('');
  const [deleteIncome, setDeleteIncome] = useState(false);
  const [deleteExpenses, setDeleteExpenses] = useState(false);

  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  // Загрузка настроек из localStorage
  useEffect(() => {
    const c = localStorage.getItem(LS.currency);
    const h = localStorage.getItem(LS.hideAmounts);

    if (c) setCurrency(c);
    if (h != null) setHideAmounts(h === '1');
  }, []);

  useEffect(() => {
    localStorage.setItem(LS.currency, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(LS.hideAmounts, hideAmounts ? '1' : '0');
  }, [hideAmounts]);

  // Обработчики редактирования профиля
  const handleSaveName = useCallback(async () => {
    // TODO: API запрос на обновление имени/фамилии
    setSnack({ open: true, severity: 'success', message: 'Имя и фамилия обновлены' });
    setEditNameOpen(false);
  }, [firstName, lastName]);

  const handleSaveEmail = useCallback(async () => {
    // TODO: API запрос на смену email
    setSnack({ open: true, severity: 'success', message: 'Email обновлён' });
    setEditEmailOpen(false);
    setNewEmail('');
    setEmailPassword('');
  }, [newEmail, emailPassword]);

  const handleSavePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      setSnack({ open: true, severity: 'error', message: 'Пароли не совпадают' });
      return;
    }
    // TODO: API запрос на смену пароля
    setSnack({ open: true, severity: 'success', message: 'Пароль изменён' });
    setEditPasswordOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [currentPassword, newPassword, confirmPassword]);

  const handleDeleteData = useCallback(async () => {
    if (!deleteMonth) {
      setSnack({ open: true, severity: 'error', message: 'Выберите месяц' });
      return;
    }
    if (!deleteIncome && !deleteExpenses) {
      setSnack({ open: true, severity: 'error', message: 'Выберите что удалить' });
      return;
    }

    // TODO: API запрос на удаление данных
    const what = [];
    if (deleteIncome) what.push('доходы');
    if (deleteExpenses) what.push('расходы');

    setSnack({
      open: true,
      severity: 'info',
      message: `Удалены ${what.join(' и ')} за ${deleteMonth}`,
    });

    setDeleteDataOpen(false);
    setDeleteMonth('');
    setDeleteIncome(false);
    setDeleteExpenses(false);
  }, [deleteMonth, deleteIncome, deleteExpenses]);

  // Генерация списка месяцев (последние 12)
  const monthOptions = useMemo(() => {
    const result = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push({ label, value });
    }
    return result;
  }, []);

  return (
    <PageWrap>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 2.5 }, pt: { xs: 0.5, md: 1 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 980,
            color: colors.text,
            letterSpacing: -0.4,
            fontSize: { xs: '1.65rem', sm: '1.85rem', md: '2.1rem' },
          }}
        >
          Настройки
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: alpha('#fff', 0.10), mb: 0 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: alpha('#fff', 0.65),
              fontWeight: 900,
              textTransform: 'none',
              fontSize: { xs: 14, md: 15 },
              minHeight: 48,
            },
            '& .Mui-selected': {
              color: '#fff',
            },
            '& .MuiTabs-indicator': {
              bgcolor: colors.primary,
              height: 3,
            },
          }}
        >
          <Tab label="Аккаунт" />
          <Tab label="Интерфейс" />
          <Tab label="Данные" />
        </Tabs>
      </Box>

      {/* TAB 0: Аккаунт */}
      {tab === 0 && (
        <Box>
          <SectionTitle>Профиль</SectionTitle>

          <RowItem>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(colors.primary, 0.18),
                color: '#fff',
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              {(user?.firstName?.[0] || user?.userName?.[0] || 'U').toUpperCase()}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 950, color: colors.text, fontSize: { xs: 16, md: 17 } }}>
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.userName || user?.email || 'Пользователь'}
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                {user?.email || 'Не указан email'}
              </Typography>
              {userId && (
                <Typography variant="caption" sx={{ color: alpha('#fff', 0.45), fontWeight: 700 }}>
                  ID: {userId}
                </Typography>
              )}
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setEditNameOpen(true)}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 900,
                borderColor: alpha('#fff', 0.16),
                color: '#fff',
                '&:hover': { borderColor: alpha('#fff', 0.28), bgcolor: alpha('#fff', 0.04) },
              }}
            >
              Изменить
            </Button>
          </RowItem>

          <SectionTitle>Безопасность</SectionTitle>

          <RowItem>
            <EmailOutlinedIcon sx={{ color: alpha('#fff', 0.75) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: 15 }}>Email</Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                {user?.email || 'Не указан'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditEmailOpen(true)}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 900,
                borderColor: alpha('#fff', 0.16),
                color: '#fff',
                '&:hover': { borderColor: alpha('#fff', 0.28), bgcolor: alpha('#fff', 0.04) },
              }}
            >
              Изменить
            </Button>
          </RowItem>

          <RowItem>
            <LockOutlinedIcon sx={{ color: alpha('#fff', 0.75) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: 15 }}>Пароль</Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                ••••••••
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditPasswordOpen(true)}
              sx={{
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 900,
                borderColor: alpha('#fff', 0.16),
                color: '#fff',
                '&:hover': { borderColor: alpha('#fff', 0.28), bgcolor: alpha('#fff', 0.04) },
              }}
            >
              Изменить
            </Button>
          </RowItem>

          <SectionTitle>О приложении</SectionTitle>

          <RowItem noDivider>
            <InfoOutlinedIcon sx={{ color: alpha('#fff', 0.75) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: 15 }}>Fintracker</Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                Версия {process.env.REACT_APP_VERSION || '1.0.0'}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), fontWeight: 700, display: 'block', mt: 0.5 }}>
                Разработчик: Дмитрий Михайлов
              </Typography>
            </Box>
          </RowItem>
        </Box>
      )}

      {/* TAB 1: Интерфейс */}
      {tab === 1 && (
        <Box>
          <SectionTitle>Отображение</SectionTitle>

          <RowItem>
            <PaletteOutlinedIcon sx={{ color: alpha('#fff', 0.75) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: 15 }}>Скрывать суммы</Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                Полезно при показе экрана другим
              </Typography>
            </Box>
            <Switch checked={hideAmounts} onChange={(e) => setHideAmounts(e.target.checked)} />
          </RowItem>

          <SectionTitle>Валюта</SectionTitle>

          <RowItem noDivider>
            <CurrencyRubleOutlinedIcon sx={{ color: alpha('#fff', 0.75) }} />
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="currency-label">Валюта</InputLabel>
                <Select
                  labelId="currency-label"
                  value={currency}
                  label="Валюта"
                  onChange={(e) => setCurrency(e.target.value)}
                  sx={{
                    borderRadius: 2.5,
                    color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#fff', 0.16) },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#fff', 0.26) },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(colors.primary, 0.65),
                    },
                    '.MuiSvgIcon-root': { color: alpha('#fff', 0.8) },
                  }}
                >
                  <MenuItem value="RUB">RUB — ₽</MenuItem>
                  <MenuItem value="USD">USD — $</MenuItem>
                  <MenuItem value="EUR">EUR — €</MenuItem>
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 1, color: alpha('#fff', 0.55), fontWeight: 700 }}
              >
                Настройка интерфейса — конвертация валют не происходит
              </Typography>
            </Box>
          </RowItem>
        </Box>
      )}

      {/* TAB 2: Данные */}
      {tab === 2 && (
        <Box>
          <SectionTitle>Удаление данных</SectionTitle>

          <RowItem noDivider>
            <DeleteOutlineOutlinedIcon sx={{ color: alpha('#fff', 0.75) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: 15, mb: 0.5 }}>
                Удалить данные за месяц
              </Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700, mb: 2 }}>
                Выберите месяц и тип данных для удаления
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => setDeleteDataOpen(true)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  fontWeight: 950,
                  textTransform: 'none',
                  borderColor: alpha('#fff', 0.16),
                  color: '#fff',
                  '&:hover': { borderColor: alpha('#fff', 0.28), bgcolor: alpha('#fff', 0.04) },
                }}
              >
                Открыть выбор
              </Button>
            </Box>
          </RowItem>
        </Box>
      )}

      {/* DIALOG: Редактирование имени */}
      <Dialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Редактировать профиль</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Имя"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              autoComplete="given-name"
            />
            <TextField
              label="Фамилия"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              autoComplete="family-name"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveName}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: Смена email */}
      <Dialog
        open={editEmailOpen}
        onClose={() => setEditEmailOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Изменить email</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Новый email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              autoComplete="email"
            />
            <TextField
              label="Текущий пароль"
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEmailOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveEmail}>
            Изменить
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: Смена пароля */}
      <Dialog
        open={editPasswordOpen}
        onClose={() => setEditPasswordOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Изменить пароль</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Текущий пароль"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
            />
            <TextField
              label="Новый пароль"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
            />
            <TextField
              label="Подтвердите новый пароль"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              autoComplete="new-password"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPasswordOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePassword}>
            Изменить
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG: Удаление данных */}
      <Dialog
        open={deleteDataOpen}
        onClose={() => setDeleteDataOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Удалить данные</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="delete-month-label">Месяц</InputLabel>
              <Select
                labelId="delete-month-label"
                value={deleteMonth}
                label="Месяц"
                onChange={(e) => setDeleteMonth(e.target.value)}
              >
                {monthOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ fontWeight: 900, mb: 1, fontSize: 14 }}>Что удалить:</Typography>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={deleteIncome} onChange={(e) => setDeleteIncome(e.target.checked)} />}
                  label="Доходы"
                />
                <FormControlLabel
                  control={
                    <Checkbox checked={deleteExpenses} onChange={(e) => setDeleteExpenses(e.target.checked)} />
                  }
                  label="Расходы"
                />
              </FormGroup>
            </Box>

            <Alert severity="warning" sx={{ fontWeight: 700 }}>
              Это действие необратимо. Данные будут удалены безвозвратно.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDataOpen(false)}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleDeleteData}>
            Удалить
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
