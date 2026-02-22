// src/pages/Settings/SettingsPage.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  CircularProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CurrencyRubleOutlinedIcon from "@mui/icons-material/CurrencyRubleOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useAuth } from "../../contexts/AuthContext";
import { bankingColors as colors } from "../../styles/bankingTokens";
import { useCurrency } from "../../contexts/CurrencyContext";

// helpers
const parseYearMonth = (str) => {
  const m = String(str || "").trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  return { year: y, month: mo };
};

const ymValue = (year, month) =>
  `${year}-${String(month).padStart(2, "0")}`;

const ymLabel = (year, month) =>
  new Date(year, month - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });

// MonthPicker
function MonthPicker({ value, onChange }) {
  const [inputVal, setInputVal] = useState(value || "");

  useEffect(() => {
    setInputVal(value || "");
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

  const MONTH_NAMES = [
    "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
    "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
  ];

  return (
    <Box>
      <TextField
        fullWidth
        label="Месяц"
        value={inputVal}
        onChange={handleInputChange}
        placeholder="ГГГГ-ММ"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthOutlinedIcon />
            </InputAdornment>
          ),
        }}
        helperText={
          value && parseYearMonth(value)
            ? ymLabel(parseYearMonth(value).year, parseYearMonth(value).month)
            : "Введите в формате ГГГГ-ММ или выберите ниже"
        }
        sx={{ mb: 2 }}
      />
      {Object.entries(months)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, monthList]) => (
          <Box key={year} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, opacity: 0.7 }}>
              {year}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {monthList.map((m) => {
                const v = ymValue(Number(year), m);
                const selected = value === v;
                return (
                  <Chip
                    key={v}
                    label={MONTH_NAMES[m - 1]}
                    onClick={() => handleChipClick(Number(year), m)}
                    sx={{
                      fontWeight: 900,
                      cursor: "pointer",
                      bgcolor: selected ? colors.primary : alpha("#000", 0.07),
                      color: selected ? "#05140C" : "inherit",
                      border: selected
                        ? `1px solid ${colors.primary}`
                        : "1px solid transparent",
                      "&:hover": {
                        bgcolor: selected ? colors.primary : alpha("#000", 0.13),
                      },
                    }}
                  />
                );
              })}
            </Stack>
          </Box>
        ))}
    </Box>
  );
}

// layout helpers
const PageWrap = ({ children }) => (
  <Box
    sx={{
      minHeight: "100vh",
      bgcolor: "#05140C",
      color: "#fff",
      px: { xs: 2, sm: 3, md: 4 },
      py: 3,
    }}
  >
    {children}
  </Box>
);

const SectionTitle = ({ children }) => (
  <Typography
    variant="h6"
    sx={{
      fontWeight: 900,
      mb: 2,
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    {children}
  </Typography>
);

const RowItem = ({ children, noDivider }) => (
  <>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        py: 2,
      }}
    >
      {children}
    </Box>
    {!noDivider && <Divider sx={{ borderColor: alpha("#fff", 0.08) }} />}
  </>
);

// main
export default function SettingsPage() {
  const {
    user,
    updateProfile,
    updateEmail,
    updateSettings,
    changePassword,
    deleteData,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const { currency, hideAmounts, setCurrency, setHideAmounts } = useCurrency();

  const [tab, setTab] = useState(0);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteMonth, setDeleteMonth] = useState("");
  const [deleteIncome, setDeleteIncome] = useState(false);
  const [deleteExpenses, setDeleteExpenses] = useState(false);

  // Loading states для каждой операции
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const showSnack = useCallback((severity, message) => {
    setSnack({ open: true, severity, message });
  }, []);

  useEffect(() => {
    setFirstName(user?.firstName || "");
    setLastName(user?.lastName || "");
  }, [user]);

  const allChecked = deleteIncome && deleteExpenses;
  const someChecked = deleteIncome || deleteExpenses;

  const handleToggleAll = (e) => {
    setDeleteIncome(e.target.checked);
    setDeleteExpenses(e.target.checked);
  };

  // --- ВАЛИДАЦИЯ ---

  const validateName = () => {
    if (!firstName.trim()) {
      showSnack("error", "Укажите имя");
      return false;
    }
    if (firstName.trim().length < 2) {
      showSnack("error", "Имя слишком короткое (минимум 2 символа)");
      return false;
    }
    if (lastName.trim() && lastName.trim().length < 2) {
      showSnack("error", "Фамилия слишком короткая (минимум 2 символа)");
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail.trim()) {
      showSnack("error", "Укажите новый email");
      return false;
    }
    if (!emailRegex.test(newEmail)) {
      showSnack("error", "Неверный формат email");
      return false;
    }
    if (!emailPassword.trim()) {
      showSnack("error", "Введите текущий пароль для подтверждения");
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (!currentPassword.trim()) {
      showSnack("error", "Введите текущий пароль");
      return false;
    }
    if (!newPassword.trim()) {
      showSnack("error", "Введите новый пароль");
      return false;
    }
    if (newPassword.length < 8) {
      showSnack("error", "Новый пароль должен содержать минимум 8 символов");
      return false;
    }
    if (newPassword !== confirmPassword) {
      showSnack("error", "Пароли не совпадают");
      return false;
    }
    if (currentPassword === newPassword) {
      showSnack("warning", "Новый пароль совпадает с текущим");
      return false;
    }
    return true;
  };

  // --- ОБРАБОТЧИКИ ---

  const handleSaveName = async () => {
    if (!validateName()) return;

    setSavingName(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });
      showSnack("success", "✓ Имя и фамилия успешно обновлены");
      setEditNameOpen(false);
    } catch (e) {
      showSnack("error", e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!validateEmail()) return;

    setSavingEmail(true);
    try {
      await updateEmail(newEmail.trim(), emailPassword);
      showSnack("success", "✓ Email успешно изменён");
      setEditEmailOpen(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (e) {
      showSnack("error", e.message);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSavePassword = async () => {
    if (!validatePassword()) return;

    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      showSnack("success", "✓ Пароль успешно изменён");
      setEditPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      showSnack("error", e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteData = async () => {
    const parsed = parseYearMonth(deleteMonth);
    if (!parsed) {
      showSnack("error", "Выберите корректный месяц в формате ГГГГ-ММ");
      return;
    }

    if (!deleteIncome && !deleteExpenses) {
      showSnack("warning", "Выберите что именно нужно удалить");
      return;
    }

    let type;
    if (deleteIncome && deleteExpenses) type = "all";
    else if (deleteIncome) type = "income";
    else type = "expenses";

    const { year, month } = parsed;

    try {
      setDeleting(true);
      await deleteData(year, month, type);

      const what = [];
      if (deleteIncome) what.push("доходы");
      if (deleteExpenses) what.push("расходы");

      showSnack(
        "success",
        `✓ Удалены ${what.join(" и ")} за ${ymLabel(year, month)}`
      );

      setDeleteDataOpen(false);
      setDeleteMonth("");
      setDeleteIncome(false);
      setDeleteExpenses(false);
    } catch (e) {
      showSnack("error", e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSettings = async (nextCurrency, nextHide) => {
    try {
      const data = await updateSettings({
        displayCurrency: nextCurrency ?? currency,
        hideAmounts: typeof nextHide === "boolean" ? nextHide : hideAmounts,
      });

      setCurrency(data.displayCurrency || "RUB");
      setHideAmounts(!!data.hideAmounts);
      showSnack("success", "✓ Настройки интерфейса обновлены");
    } catch (e) {
      showSnack("error", e.message);
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

  if (authLoading) {
    return (
      <PageWrap>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Загрузка настроек...</Typography>
        </Box>
      </PageWrap>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <PageWrap>
      <Typography variant="h4" sx={{ fontWeight: 950, mb: 3 }}>
        Настройки
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          "& .MuiTab-root": {
            color: alpha("#fff", 0.65),
            fontWeight: 900,
            textTransform: "none",
            fontSize: { xs: 14, md: 15 },
            minHeight: 48,
          },
          "& .Mui-selected": { color: "#fff" },
          "& .MuiTabs-indicator": {
            bgcolor: colors.primary,
            height: 3,
          },
        }}
      >
        <Tab icon={<EditOutlinedIcon />} label="Профиль" />
        <Tab icon={<PaletteOutlinedIcon />} label="Интерфейс" />
        <Tab icon={<DeleteOutlineOutlinedIcon />} label="Данные" />
      </Tabs>

      <Box sx={{ mt: 3 }}>
        {tab === 0 && (
          <Box>
            <SectionTitle>Профиль</SectionTitle>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: colors.primary,
                  color: "#05140C",
                  fontWeight: 950,
                  fontSize: 28,
                }}
              >
                {(user?.firstName?.[0] || user?.userName?.[0] || "U")
                  .toUpperCase()
                  .slice(0, 1)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.userName || user?.email || "Пользователь"}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  {user?.email || "Не указан email"}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<EditOutlinedIcon />}
                onClick={() => setEditNameOpen(true)}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 900,
                  borderColor: alpha("#fff", 0.16),
                  color: "#fff",
                  "&:hover": {
                    borderColor: alpha("#fff", 0.28),
                    bgcolor: alpha("#fff", 0.04),
                  },
                }}
              >
                Изменить
              </Button>
            </Box>

            <Divider sx={{ borderColor: alpha("#fff", 0.08), mb: 2 }} />

            <SectionTitle>Безопасность</SectionTitle>

            <RowItem>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <EmailOutlinedIcon />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    {user?.email || "Не указан"}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEditEmailOpen(true)}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 900,
                  borderColor: alpha("#fff", 0.16),
                  color: "#fff",
                  "&:hover": {
                    borderColor: alpha("#fff", 0.28),
                    bgcolor: alpha("#fff", 0.04),
                  },
                }}
              >
                Изменить
              </Button>
            </RowItem>

            <RowItem noDivider>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LockOutlinedIcon />
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    Пароль
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    ••••••••
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setEditPasswordOpen(true)}
                sx={{
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontWeight: 900,
                  borderColor: alpha("#fff", 0.16),
                  color: "#fff",
                  "&:hover": {
                    borderColor: alpha("#fff", 0.28),
                    bgcolor: alpha("#fff", 0.04),
                  },
                }}
              >
                Изменить
              </Button>
            </RowItem>

            <Divider sx={{ borderColor: alpha("#fff", 0.08), my: 2 }} />

            <SectionTitle>
              <InfoOutlinedIcon /> О приложении
            </SectionTitle>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
              FinTrackerPro
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>
              Версия <strong>{process.env.REACT_APP_VERSION || "1.0.0"}</strong>
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Создатель: Дмитрий Михайлов
            </Typography>
          </Box>
        )}

        {tab === 1 && (
          <Box>
            <SectionTitle>Отображение</SectionTitle>

            <RowItem>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  Скрывать суммы
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Полезно при показе экрана другим
                </Typography>
              </Box>
              <Switch
                checked={hideAmounts}
                onChange={(e) => handleToggleHideAmounts(e.target.checked)}
              />
            </RowItem>

            <RowItem noDivider>
              <FormControl fullWidth>
                <InputLabel sx={{ color: alpha("#fff", 0.7) }}>
                  Валюта
                </InputLabel>
                <Select
                  value={currency}
                  label="Валюта"
                  onChange={(e) => handleChangeCurrency(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <CurrencyRubleOutlinedIcon />
                    </InputAdornment>
                  }
                  sx={{
                    borderRadius: 2.5,
                    color: "#fff",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha("#fff", 0.16),
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha("#fff", 0.26),
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: alpha(colors.primary, 0.65),
                    },
                    ".MuiSvgIcon-root": {
                      color: alpha("#fff", 0.8),
                    },
                  }}
                >
                  <MenuItem value="RUB">RUB — ₽</MenuItem>
                  <MenuItem value="USD">USD — $</MenuItem>
                  <MenuItem value="EUR">EUR — €</MenuItem>
                </Select>
              </FormControl>
            </RowItem>

            <Box sx={{ mt: 3, p: 2, bgcolor: alpha("#fff", 0.03), borderRadius: 2 }}>
              <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                💡 Данные хранятся в базовой валюте, здесь только отображение и конвертация
              </Typography>
              <Typography variant="caption" sx={{ display: "block", opacity: 0.6, mt: 1 }}>
                Текущие курсы (пример): 1 USD ≈ 90 ₽ • 1 EUR ≈ 100 ₽
              </Typography>
            </Box>
          </Box>
        )}

        {tab === 2 && (
          <Box>
            <SectionTitle>Удаление данных</SectionTitle>

            <Alert severity="info" sx={{ mb: 2 }}>
              Эта операция удаляет данные только за выбранный месяц. Остальные периоды останутся без изменений.
            </Alert>

            <Box
              sx={{
                p: 2,
                bgcolor: alpha("#fff", 0.03),
                borderRadius: 2,
                mb: 2,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
                Удалить данные за месяц
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                Выберите месяц и тип данных для удаления
              </Typography>
              <Button
                variant="outlined"
                startIcon={<DeleteOutlineOutlinedIcon />}
                onClick={() => setDeleteDataOpen(true)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  fontWeight: 950,
                  textTransform: "none",
                  borderColor: alpha("#fff", 0.16),
                  color: "#fff",
                  "&:hover": {
                    borderColor: alpha("#fff", 0.28),
                    bgcolor: alpha("#fff", 0.04),
                  },
                }}
              >
                Открыть выбор
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Диалог: Имя */}
      <Dialog
        open={editNameOpen}
        onClose={() => !savingName && setEditNameOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Редактировать профиль</DialogTitle>
        <DialogContent>
          <TextField
            label="Имя"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            autoComplete="given-name"
            disabled={savingName}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Фамилия"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            autoComplete="family-name"
            disabled={savingName}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameOpen(false)} disabled={savingName}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveName}
            disabled={savingName}
            startIcon={savingName ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
          >
            {savingName ? "Сохранение..." : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог: Email */}
      <Dialog
        open={editEmailOpen}
        onClose={() => !savingEmail && setEditEmailOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Изменить email</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            После изменения email потребуется войти заново
          </Alert>
          <TextField
            label="Новый email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            autoComplete="email"
            disabled={savingEmail}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Текущий пароль"
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
            disabled={savingEmail}
            helperText="Введите пароль для подтверждения"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEmailOpen(false)} disabled={savingEmail}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEmail}
            disabled={savingEmail}
            startIcon={savingEmail ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
          >
            {savingEmail ? "Изменение..." : "Изменить"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог: Пароль */}
      <Dialog
        open={editPasswordOpen}
        onClose={() => !savingPassword && setEditPasswordOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Изменить пароль</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Пароль должен содержать минимум 8 символов
          </Alert>
          <TextField
            label="Текущий пароль"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
            disabled={savingPassword}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Новый пароль"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
            disabled={savingPassword}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Подтвердите новый пароль"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
            disabled={savingPassword}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPasswordOpen(false)} disabled={savingPassword}>
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePassword}
            disabled={savingPassword}
            startIcon={savingPassword ? <CircularProgress size={16} /> : <CheckCircleOutlineIcon />}
          >
            {savingPassword ? "Изменение..." : "Изменить"}
          </Button>
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
        <DialogTitle>Удалить данные</DialogTitle>
        <DialogContent>
          <MonthPicker value={deleteMonth} onChange={setDeleteMonth} />

          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Что удалить:
          </Typography>

          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={allChecked}
                  indeterminate={someChecked && !allChecked}
                  onChange={handleToggleAll}
                  disabled={deleting}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Всё (доходы и расходы)
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteIncome}
                  onChange={(e) => setDeleteIncome(e.target.checked)}
                  disabled={deleting}
                />
              }
              label="Доходы"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteExpenses}
                  onChange={(e) => setDeleteExpenses(e.target.checked)}
                  disabled={deleting}
                />
              }
              label="Расходы"
            />
          </FormGroup>

          <Alert severity="error" sx={{ mt: 2 }}>
            ⚠️ Это действие необратимо! Данные будут удалены безвозвратно
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDataOpen(false)} disabled={deleting}>
            Отмена
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteData}
            disabled={deleting}
            startIcon={deleting && <CircularProgress size={16} />}
          >
            {deleting ? "Удаление..." : "Удалить навсегда"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%", fontWeight: 600 }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </PageWrap>
  );
}
