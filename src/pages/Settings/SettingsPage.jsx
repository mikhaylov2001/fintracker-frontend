// src/pages/Settings/SettingsPage.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Typography,
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
  Stack,
  Chip,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import CurrencyRubleOutlinedIcon from '@mui/icons-material/CurrencyRubleOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

import { useAuth } from '../../contexts/AuthContext';
import { bankingColors as colors } from '../../styles/bankingTokens';
import { useCurrency } from '../../contexts/CurrencyContext';

// ─── helpers ───
const parseYearMonth = (str) => {
  const m = String(str || '').trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return { year: y, month: mo };
};

const ymValue = (year, month) =>
  `${year}-${String(month).padStart(2, '0')}`;

const ymLabel = (year, month) =>
  new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

// ─── MonthPicker ───
function MonthPicker({ value, onChange }) {
  const [inputVal, setInputVal] = useState(value || '');

  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  const months = useMemo(() => {
    const now = new Date();
    const list = [];
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const grouped = {};
    for (const item of list) {
      if (!grouped[item.year]) grouped[item.year] = [];
      grouped[item.year].push(item.month);
    }
    return grouped;
  }, []);

  const handleChipClick = (year, month) => {
    const v = ymValue(year, month);
    setInputVal(v);
    onChange(v);
  };

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputVal(v);
    const parsed = parseYearMonth(v);
    if (parsed) onChange(ymValue(parsed.year, parsed.month));
  };

  const MONTH_NAMES = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        label="Месяц (ГГГГ-ММ)"
        placeholder="2026-02"
        value={inputVal}
        onChange={handleInputChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthOutlinedIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        helperText={
          value && parseYearMonth(value)
            ? ymLabel(parseYearMonth(value).year, parseYearMonth(value).month)
            : 'Введите в формате ГГГГ-ММ или выберите ниже'
        }
        sx={{ mb: 2 }}
      />

      {Object.entries(months)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, monthList]) => (
          <Box key={year} sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              sx={{ fontWeight: 900, color: alpha('#000', 0.5), mb: 0.75, display: 'block' }}
            >
              {year}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {monthList.map((m) => {
                const v = ymValue(Number(year), m);
                const selected = value === v;
                return (
                  <Chip
                    key={m}
                    label={MONTH_NAMES[m - 1]}
                    size="small"
                    onClick={() => handleChipClick(Number(year), m)}
                    sx={{
                      fontWeight: 900,
                      cursor: 'pointer',
                      bgcolor: selected ? colors.primary : alpha('#000', 0.07),
                      color: selected ? '#05140C' : 'inherit',
                      border: selected
                        ? `1px solid ${colors.primary}`
                        : '1px solid transparent',
                      '&:hover': {
                        bgcolor: selected
                          ? colors.primary
                          : alpha('#000', 0.13),
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        ))}
    </Box>
  );
}

// ─── Layout helpers ───
const PageWrap = ({ children }) => (
  <Box sx={{ width: '100%', mx: 'auto', maxWidth: { xs: '100%', sm: 720, md: 900, lg: 1040 } }}>
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

// ─── Main ───
export default function SettingsPage() {
  const { user, authFetch, updateUserInState } = useAuth();
  const { currency, hideAmounts, setCurrency, setHideAmounts } = useCurrency();

  const [tab, setTab] = useState(0);

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deleteMonth, setDeleteMonth] = useState('');
  const [deleteIncome, setDeleteIncome] = useState(false);
  const [deleteExpenses, setDeleteExpenses] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snack, setSnack] = useState({ open: false, severity: 'success', message: '' });

  const showSnack = useCallback((severity, message) => {
    setSnack({ open: true, severity, message });
  }, []);

  useEffect(() => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
  }, [user]);

  const allChecked = deleteIncome && deleteExpenses;
  const someChecked = deleteIncome || deleteExpenses;
  const handleToggleAll = (e) => {
    setDeleteIncome(e.target.checked);
    setDeleteExpenses(e.target.checked);
  };

  const handleSaveName = async () => {
    try {
      const res = await authFetch('/api/account/profile', {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Не удалось обновить профиль');
      }
      const updatedUser = await res.json();
      updateUserInState(updatedUser);
      showSnack('success', 'Имя и фамилия обновлены');
      setEditNameOpen(false);
    } catch (e) {
      showSnack('error', e.message || 'Не удалось обновить профиль');
    }
  };

  const handleSaveEmail = async () => {
    try {
      const res = await authFetch('/api/account/email', {
        method: 'PUT',
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Не удалось изменить email');
      }
      const updatedUser = await res.json();
      updateUserInState(updatedUser);
      showSnack('success', 'Email обновлён');
      setEditEmailOpen(false);
      setNewEmail('');
      setEmailPassword('');
    } catch (e) {
      showSnack('error', e.message || 'Не удалось изменить email');
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      showSnack('error', 'Пароли не совпадают');
      return;
    }
    try {
      const res = await authFetch('/api/account/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Не удалось изменить пароль');
      }
      showSnack('success', 'Пароль изменён');
      setEditPasswordOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      showSnack('error', e.message || 'Не удалось изменить пароль');
    }
  };

  const handleDeleteData = async () => {
    if (!deleteMonth || !parseYearMonth(deleteMonth)) {
      showSnack('error', 'Выберите корректный месяц');
      return;
    }
    if (!deleteIncome && !deleteExpenses) {
      showSnack('error', 'Выберите что удалить');
      return;
    }

    let type;
    if (deleteIncome && deleteExpenses) type = 'all';
    else if (deleteIncome) type = 'income';
    else type = 'expenses';

    const { year, month } = parseYearMonth(deleteMonth);

    try {
      setDeleting(true);
      const res = await authFetch(
        `/api/data/me/month/${year}/${month}?type=${type}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Ошибка при удалении');
      }

      const what = [];
      if (deleteIncome) what.push('доходы');
      if (deleteExpenses) what.push('расходы');

      showSnack(
        'success',
        `Удалены ${what.join(' и ')} за ${ymLabel(year, month)}`
      );
      setDeleteDataOpen(false);
      setDeleteMonth('');
      setDeleteIncome(false);
      setDeleteExpenses(false);
    } catch (e) {
      showSnack('error', e.message || 'Ошибка при удалении');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSettings = async (nextCurrency, nextHide) => {
    try {
      const res = await authFetch('/api/settings/me', {
        method: 'PUT',
        body: JSON.stringify({
          displayCurrency: nextCurrency ?? currency,
          hideAmounts: typeof nextHide === 'boolean' ? nextHide : hideAmounts,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || d.error || 'Не удалось обновить настройки');
      }
      const data = await res.json();
      setCurrency(data.displayCurrency || 'RUB');
      setHideAmounts(data.hideAmounts);
      showSnack('success', 'Настройки интерфейса обновлены');
    } catch (e) {
      showSnack('error', e.message || 'Не удалось обновить настройки интерфейса');
    }
  };

  const handleToggleHideAmounts = (checked) => {
    setHideAmounts(checked);
    handleUpdateSettings(undefined, checked);
  };

  const handleChangeCurrency = (val) => {
    setCurrency(val);
    handleUpdateSettings(val, undefined);
  };

  return (
    <PageWrap>
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

      <Box sx={{ borderBottom: 1, borderColor: alpha('#fff', 0.1), mb: 0 }}>
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
            '& .Mui-selected': { color: '#fff' },
            '& .MuiTabs-indicator': { bgcolor: colors.primary, height: 3 },
          }}
        >
          <Tab label="Аккаунт" />
          <Tab label="Интерфейс" />
          <Tab label="Данные" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box>
          <SectionTitle>Профиль</SectionTitle>
          <RowItem>
            <Avatar
              sx={{
                width: 56, height: 56,
                bgcolor: alpha(colors.primary, 0.18),
                color: '#fff', fontSize: 22, fontWeight: 900,
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
            </Box>
            <Button
              variant="outlined" size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setEditNameOpen(true)}
              sx={{
                borderRadius: 2.5, textTransform: 'none', fontWeight: 900,
                borderColor: alpha('#fff', 0.16), color: '#fff',
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
              variant="outlined" size="small"
              onClick={() => setEditEmailOpen(true)}
              sx={{
                borderRadius: 2.5, textTransform: 'none', fontWeight: 900,
                borderColor: alpha('#fff', 0.16), color: '#fff',
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
              variant="outlined" size="small"
              onClick={() => setEditPasswordOpen(true)}
              sx={{
                borderRadius: 2.5, textTransform: 'none', fontWeight: 900,
                borderColor: alpha('#fff', 0.16), color: '#fff',
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
              <Typography sx={{ fontWeight: 900, color: colors.text, fontSize: 15 }}>FinTrackerPro</Typography>
              <Typography variant="body2" sx={{ color: alpha('#fff', 0.6), fontWeight: 700 }}>
                Версия {process.env.REACT_APP_VERSION || '1.0.0'}
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), fontWeight: 700, display: 'block', mt: 0.5 }}>
                Создатель: Дмитрий Михайлов
              </Typography>
            </Box>
          </RowItem>
        </Box>
      )}

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
            <Switch
              checked={hideAmounts}
              onChange={(e) => handleToggleHideAmounts(e.target.checked)}
            />
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
                  onChange={(e) => handleChangeCurrency(e.target.value)}
                  sx={{
                    borderRadius: 2.5, color: '#fff',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: alpha('#fff', 0.16) },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#fff', 0.26) },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: alpha(colors.primary, 0.65) },
                    '.MuiSvgIcon-root': { color: alpha('#fff', 0.8) },
                  }}
                >
                  <MenuItem value="RUB">RUB — ₽</MenuItem>
                  <MenuItem value="USD">USD — $</MenuItem>
                  <MenuItem value="EUR">EUR — €</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: alpha('#fff', 0.55), fontWeight: 700 }}>
                Данные хранятся в базовой валюте, здесь только отображение и конвертация.
              </Typography>
            </Box>
          </RowItem>
        </Box>
      )}

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
                fullWidth variant="outlined"
                onClick={() => setDeleteDataOpen(true)}
                sx={{
                  borderRadius: 2.5, py: 1.2, fontWeight: 950, textTransform: 'none',
                  borderColor: alpha('#fff', 0.16), color: '#fff',
                  '&:hover': { borderColor: alpha('#fff', 0.28), bgcolor: alpha('#fff', 0.04) },
                }}
              >
                Открыть выбор
              </Button>
            </Box>
          </RowItem>
        </Box>
      )}


      {/* Диалог: Имя */}
      <Dialog open={editNameOpen} onClose={() => setEditNameOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 950 }}>Редактировать профиль</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth autoComplete="given-name" />
            <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth autoComplete="family-name" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveName}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог: Email */}
      <Dialog open={editEmailOpen} onClose={() => setEditEmailOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 950 }}>Изменить email</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Новый email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} fullWidth autoComplete="email" />
            <TextField label="Текущий пароль" type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} fullWidth autoComplete="current-password" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEmailOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveEmail}>Изменить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог: Пароль */}
      <Dialog open={editPasswordOpen} onClose={() => setEditPasswordOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 950 }}>Изменить пароль</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Текущий пароль" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} fullWidth autoComplete="current-password" />
            <TextField label="Новый пароль" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} fullWidth autoComplete="new-password" />
            <TextField label="Подтвердите новый пароль" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} fullWidth autoComplete="new-password" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPasswordOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePassword}>Изменить</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог: Удаление данных */}
      <Dialog
        open={deleteDataOpen}
        onClose={() => !deleting && setDeleteDataOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 950 }}>Удалить данные</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>

            <MonthPicker value={deleteMonth} onChange={setDeleteMonth} />

            <Box>
              <Typography sx={{ fontWeight: 900, mb: 1, fontSize: 14 }}>Что удалить:</Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked && !allChecked}
                      onChange={handleToggleAll}
                    />
                  }
                  label={<Typography sx={{ fontWeight: 900 }}>Всё</Typography>}
                />
                <Divider sx={{ my: 0.5 }} />
                <FormControlLabel
                  control={<Checkbox checked={deleteIncome} onChange={(e) => setDeleteIncome(e.target.checked)} />}
                  label="Доходы"
                />
                <FormControlLabel
                  control={<Checkbox checked={deleteExpenses} onChange={(e) => setDeleteExpenses(e.target.checked)} />}
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
          <Button onClick={() => setDeleteDataOpen(false)} disabled={deleting}>
            Отмена
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteData}
            disabled={deleting}
          >
            {deleting ? 'Удаление...' : 'Удалить'}
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
