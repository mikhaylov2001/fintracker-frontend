import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box, Typography, Tabs, Tab, Switch, FormControl, InputLabel, Select, MenuItem,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, Checkbox, FormControlLabel, FormGroup, Avatar, Stack, Chip, InputAdornment,
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

import { useAuth } from "../../contexts/AuthContext";
import { bankingColors as colors } from "../../styles/bankingTokens";

// --- Helpers (оставляем без изменений) ---
const parseYearMonth = (str) => {
  const m = String(str || "").trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
};
const ymValue = (year, month) => `${year}-${String(month).padStart(2, "0")}`;
const ymLabel = (year, month) => new Date(year, month - 1, 1).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

// --- Вспомогательный компонент выбора месяца ---
function MonthPicker({ value, onChange }) {
  const [inputVal, setInputVal] = useState(value || "");
  useEffect(() => setInputVal(value || ""), [value]);

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

  const MONTH_NAMES = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

  return (
    <Box>
      <TextField
        fullWidth size="small" label="Месяц (ГГГГ-ММ)" value={inputVal}
        onChange={(e) => { setInputVal(e.target.value); const p = parseYearMonth(e.target.value); if (p) onChange(ymValue(p.year, p.month)); }}
        InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthOutlinedIcon fontSize="small" /></InputAdornment> }}
        sx={{ mb: 2 }}
      />
      {Object.entries(months).sort(([a], [b]) => Number(b) - Number(a)).map(([year, monthList]) => (
        <Box key={year} sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: alpha("#000", 0.5), mb: 0.75, display: "block" }}>{year}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {monthList.map((m) => {
              const v = ymValue(Number(year), m);
              const selected = value === v;
              return (
                <Chip key={m} label={MONTH_NAMES[m - 1]} size="small" onClick={() => onChange(v)}
                  sx={{ fontWeight: 900, bgcolor: selected ? colors.primary : alpha("#000", 0.07) }}
                />
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

// --- Layout Helpers ---
const PageWrap = ({ children }) => <Box sx={{ width: "100%", mx: "auto", maxWidth: { xs: "100%", sm: 720, md: 900, lg: 1040 }, userSelect: "none" }}>{children}</Box>;
const SectionTitle = ({ children }) => <Typography sx={{ fontSize: 14, fontWeight: 950, color: alpha("#fff", 0.55), mb: 1.5, mt: 3, textTransform: "uppercase" }}>{children}</Typography>;
const RowItem = ({ children, noDivider }) => (
  <><Box sx={{ py: 2.25, px: 3, display: "flex", alignItems: "center", gap: 2 }}>{children}</Box>{!noDivider && <Divider sx={{ borderColor: alpha("#fff", 0.08) }} />}</>
);

// --- ОСНОВНОЙ КОМПОНЕНТ ---
export default function SettingsPage() {
  const { user, updateProfile, deleteDataByMonth, isAuthenticated, loading: authLoading } = useAuth(); // Берем новые функции!

  const [tab, setTab] = useState(0);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [editPasswordOpen, setEditPasswordOpen] = useState(false);
  const [deleteDataOpen, setDeleteDataOpen] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deleteMonth, setDeleteMonth] = useState("");
  const [deleteIncome, setDeleteIncome] = useState(false);
  const [deleteExpenses, setDeleteExpenses] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [snack, setSnack] = useState({ open: false, severity: "success", message: "" });
  const showSnack = (severity, message) => setSnack({ open: true, severity, message });

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
    }
  }, [user]);

  // 1. ИЗМЕНЕНИЕ ИМЕНИ (Аккаунт)
  const handleSaveName = async () => {
    const res = await updateProfile({ firstName, lastName });
    if (res.success) {
      showSnack("success", "Профиль обновлен");
      setEditNameOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  // 2. ИЗМЕНЕНИЕ EMAIL (Аккаунт)
  const handleSaveEmail = async () => {
    const res = await updateProfile({ email: newEmail });
    if (res.success) {
      showSnack("success", "Email изменен");
      setEditEmailOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  // 3. СКРЫТИЕ СУММ (Интерфейс)
  const handleToggleHide = async (checked) => {
    const res = await updateProfile({ hideAmounts: checked });
    if (!res.success) showSnack("error", res.error);
  };

  // 4. СМЕНА ВАЛЮТЫ (Интерфейс)
  const handleChangeCurrency = async (val) => {
    const res = await updateProfile({ currency: val });
    if (!res.success) showSnack("error", res.error);
  };

  // 5. УДАЛЕНИЕ ДАННЫХ (Данные)
  const handleDeleteData = async () => {
    const parsed = parseYearMonth(deleteMonth);
    if (!parsed || (!deleteIncome && !deleteExpenses)) {
      showSnack("error", "Выберите месяц и тип данных");
      return;
    }

    setDeleting(true);
    let type = deleteIncome && deleteExpenses ? "all" : deleteIncome ? "income" : "expenses";
    
    const res = await deleteDataByMonth(deleteMonth, type);
    if (res.success) {
      showSnack("success", "Данные успешно удалены");
      setDeleteDataOpen(false);
    } else {
      showSnack("error", res.error);
    }
    setDeleting(false);
  };

  if (authLoading) return <PageWrap><Typography sx={{ color: "#fff", mt: 4, textAlign: "center" }}>Загрузка настроек...</Typography></PageWrap>;
  if (!isAuthenticated) return null;

  return (
    <PageWrap>
      <Box sx={{ mb: 3, pt: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 980, color: "#fff" }}>Настройки</Typography>
      </Box>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2, "& .MuiTabs-indicator": { bgcolor: colors.primary } }}>
        <Tab label="Аккаунт" sx={{ color: "#fff", fontWeight: 900 }} />
        <Tab label="Интерфейс" sx={{ color: "#fff", fontWeight: 900 }} />
        <Tab label="Данные" sx={{ color: "#fff", fontWeight: 900 }} />
      </Tabs>

      {/* ВКЛАДКА АККАУНТ */}
      {tab === 0 && (
        <Box>
          <SectionTitle>Профиль</SectionTitle>
          <RowItem>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(colors.primary, 0.2) }}>{user?.firstName?.[0] || "U"}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950, color: "#fff" }}>{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.6) }}>{user?.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditNameOpen(true)} sx={{ borderRadius: 2, color: "#fff" }}>Изменить</Button>
          </RowItem>

          <SectionTitle>Безопасность</SectionTitle>
          <RowItem>
            <EmailOutlinedIcon sx={{ color: "#fff" }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Email</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.6) }}>{user?.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditEmailOpen(true)} sx={{ borderRadius: 2, color: "#fff" }}>Изменить</Button>
          </RowItem>
        </Box>
      )}

      {/* ВКЛАДКА ИНТЕРФЕЙС */}
      {tab === 1 && (
        <Box>
          <SectionTitle>Отображение</SectionTitle>
          <RowItem>
            <PaletteOutlinedIcon sx={{ color: "#fff" }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Скрывать суммы</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.6) }}>Полезно при показе экрана другим</Typography>
            </Box>
            <Switch checked={user?.hideAmounts || false} onChange={(e) => handleToggleHide(e.target.checked)} />
          </RowItem>

          <SectionTitle>Валюта</SectionTitle>
          <RowItem noDivider>
            <CurrencyRubleOutlinedIcon sx={{ color: "#fff" }} />
            <Box sx={{ flex: 1 }}>
              <FormControl fullWidth size="small">
                <Select value={user?.currency || "RUB"} onChange={(e) => handleChangeCurrency(e.target.value)} sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.2) } }}>
                  <MenuItem value="RUB">RUB — ₽</MenuItem>
                  <MenuItem value="USD">USD — $ (курс 90)</MenuItem>
                  <MenuItem value="EUR">EUR — € (курс 100)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </RowItem>
        </Box>
      )}

      {/* ВКЛАДКА ДАННЫЕ */}
      {tab === 2 && (
        <Box>
          <SectionTitle>Удаление данных</SectionTitle>
          <RowItem noDivider>
            <DeleteOutlineOutlinedIcon sx={{ color: "#fff" }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff", mb: 1 }}>Удалить данные за месяц</Typography>
              <Button fullWidth variant="outlined" onClick={() => setDeleteDataOpen(true)} sx={{ borderRadius: 2, color: "#fff" }}>Открыть выбор</Button>
            </Box>
          </RowItem>
        </Box>
      )}

      {/* ДИАЛОГИ (МОДАЛКИ) */}
      <Dialog open={editNameOpen} onClose={() => setEditNameOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Редактировать профиль</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Имя" value={firstName} onChange={(e) => setFirstName(e.target.value)} fullWidth />
            <TextField label="Фамилия" value={lastName} onChange={(e) => setLastName(e.target.value)} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveName}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDataOpen} onClose={() => !deleting && setDeleteDataOpen(false)}>
        <DialogTitle sx={{ fontWeight: 900 }}>Удалить данные</DialogTitle>
        <DialogContent dividers>
          <MonthPicker value={deleteMonth} onChange={setDeleteMonth} />
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel control={<Checkbox checked={deleteIncome} onChange={(e) => setDeleteIncome(e.target.checked)} />} label="Доходы" />
            <FormControlLabel control={<Checkbox checked={deleteExpenses} onChange={(e) => setDeleteExpenses(e.target.checked)} />} label="Расходы" />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDataOpen(false)} disabled={deleting}>Отмена</Button>
          <Button color="error" variant="contained" onClick={handleDeleteData} disabled={deleting}>Удалить</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </PageWrap>
  );
}