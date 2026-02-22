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

// --- Helpers (Твои оригинальные) ---
const parseYearMonth = (str) => {
  const m = String(str || "").trim().match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
};
const ymValue = (year, month) => `${year}-${String(month).padStart(2, "0")}`;
const ymLabel = (year, month) => new Date(year, month - 1, 1).toLocaleDateString("ru-RU", { month: "long", year: "numeric" });

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
        onChange={(e) => {
          setInputVal(e.target.value);
          const p = parseYearMonth(e.target.value);
          if (p) onChange(ymValue(p.year, p.month));
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <CalendarMonthOutlinedIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      {Object.entries(months)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([year, monthList]) => (
          <Box key={year} sx={{ mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 900, color: alpha("#000", 0.5), mb: 0.75, display: "block" }}>
              {year}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
              {monthList.map((m) => {
                const v = ymValue(Number(year), m);
                const selected = value === v;
                return (
                  <Chip
                    key={m}
                    label={MONTH_NAMES[m - 1]}
                    size="small"
                    onClick={() => onChange(v)}
                    sx={{
                      fontWeight: 900,
                      bgcolor: selected ? colors.primary : alpha("#000", 0.07),
                      color: selected ? "#fff" : "inherit",
                      "&:hover": { bgcolor: selected ? colors.primary : alpha("#000", 0.12) },
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

const PageWrap = ({ children }) => (
  <Box sx={{ width: "100%", mx: "auto", maxWidth: { xs: "100%", sm: 720, md: 900, lg: 1040 }, userSelect: "none" }}>
    {children}
  </Box>
);

const SectionTitle = ({ children }) => (
  <Typography sx={{ fontSize: 14, fontWeight: 950, color: alpha("#fff", 0.55), mb: 1.5, mt: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>
    {children}
  </Typography>
);

const RowItem = ({ children, noDivider }) => (
  <>
    <Box sx={{ py: 2.25, px: 3, display: "flex", alignItems: "center", gap: 2, transition: "background 0.2s" }}>
      {children}
    </Box>
    {!noDivider && <Divider sx={{ borderColor: alpha("#fff", 0.08), mx: 3 }} />}
  </>
);

export default function SettingsPage() {
  const { user, updateProfile, deleteDataByMonth, isAuthenticated, loading: authLoading } = useAuth();

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

  const handleSaveName = async () => {
    const res = await updateProfile({ firstName, lastName });
    if (res.success) {
      showSnack("success", "Имя успешно обновлено");
      setEditNameOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  const handleSaveEmail = async () => {
    const res = await updateProfile({ email: newEmail });
    if (res.success) {
      showSnack("success", "Email изменен и сохранен в базе");
      setEditEmailOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      showSnack("error", "Пароли не совпадают");
      return;
    }
    const res = await updateProfile({ currentPassword, newPassword });
    if (res.success) {
      showSnack("success", "Пароль успешно изменен");
      setEditPasswordOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  const handleDeleteData = async () => {
    if (!deleteMonth) return showSnack("error", "Выберите месяц");
    setDeleting(true);
    const type = deleteIncome && deleteExpenses ? "all" : deleteIncome ? "income" : "expenses";
    const res = await deleteDataByMonth(deleteMonth, type);
    if (res.success) {
      showSnack("success", "Данные за " + ymLabel(...Object.values(parseYearMonth(deleteMonth))) + " удалены");
      setDeleteDataOpen(false);
    } else {
      showSnack("error", res.error);
    }
    setDeleting(false);
  };

  if (authLoading) return null;
  if (!isAuthenticated) return null;

  return (
    <PageWrap>
      <Box sx={{ mb: 3, pt: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 980, color: "#fff", letterSpacing: -1 }}>Настройки</Typography>
      </Box>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2, "& .MuiTabs-indicator": { bgcolor: colors.primary, height: 3, borderRadius: "3px 3px 0 0" } }}>
        <Tab label="Аккаунт" sx={{ color: "#fff", fontWeight: 900, fontSize: 15, textTransform: "none", opacity: tab === 0 ? 1 : 0.5 }} />
        <Tab label="Интерфейс" sx={{ color: "#fff", fontWeight: 900, fontSize: 15, textTransform: "none", opacity: tab === 1 ? 1 : 0.5 }} />
        <Tab label="Данные" sx={{ color: "#fff", fontWeight: 900, fontSize: 15, textTransform: "none", opacity: tab === 2 ? 1 : 0.5 }} />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ bgcolor: alpha("#fff", 0.03), borderRadius: 4, border: `1px solid ${alpha("#fff", 0.08)}`, overflow: "hidden" }}>
          <SectionTitle sx={{ px: 3 }}>Профиль</SectionTitle>
          <RowItem>
            <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(colors.primary, 0.2), color: colors.primary, fontWeight: 900, fontSize: 20 }}>{user?.firstName?.[0]}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 950, color: "#fff", fontSize: 17 }}>{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5), fontWeight: 700 }}>{user?.email}</Typography>
            </Box>
            <Button variant="contained" onClick={() => setEditNameOpen(true)} startIcon={<EditOutlinedIcon />} sx={{ bgcolor: alpha("#fff", 0.08), "&:hover": { bgcolor: alpha("#fff", 0.12) }, borderRadius: 3, fontWeight: 900, textTransform: "none" }}>Изменить</Button>
          </RowItem>

          <SectionTitle sx={{ px: 3 }}>Безопасность</SectionTitle>
          <RowItem>
            <EmailOutlinedIcon sx={{ color: alpha("#fff", 0.5) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Email почта</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>{user?.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditEmailOpen(true)} sx={{ borderRadius: 3, borderColor: alpha("#fff", 0.2), color: "#fff", fontWeight: 900 }}>Сменить</Button>
          </RowItem>
          <RowItem noDivider>
            <LockOutlinedIcon sx={{ color: alpha("#fff", 0.5) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Пароль</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>Обновлен недавно</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditPasswordOpen(true)} sx={{ borderRadius: 3, borderColor: alpha("#fff", 0.2), color: "#fff", fontWeight: 900 }}>Сменить</Button>
          </RowItem>
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ bgcolor: alpha("#fff", 0.03), borderRadius: 4, border: `1px solid ${alpha("#fff", 0.08)}`, overflow: "hidden" }}>
          <SectionTitle sx={{ px: 3 }}>Отображение</SectionTitle>
          <RowItem>
            <PaletteOutlinedIcon sx={{ color: alpha("#fff", 0.5) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Скрывать суммы</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>Показывает **** вместо чисел</Typography>
            </Box>
            <Switch checked={user?.hideAmounts || false} onChange={(e) => updateProfile({ hideAmounts: e.target.checked })} />
          </RowItem>
          <SectionTitle sx={{ px: 3 }}>Валюта</SectionTitle>
          <RowItem noDivider>
            <CurrencyRubleOutlinedIcon sx={{ color: alpha("#fff", 0.5) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff", mb: 0.5 }}>Основная валюта</Typography>
              <FormControl fullWidth size="small">
                <Select value={user?.currency || "RUB"} onChange={(e) => updateProfile({ currency: e.target.value })} sx={{ color: "#fff", bgcolor: alpha("#fff", 0.05), borderRadius: 2 }}>
                  <MenuItem value="RUB">Рубль (₽)</MenuItem>
                  <MenuItem value="USD">Доллар ($) — курс 90</MenuItem>
                  <MenuItem value="EUR">Евро (€) — курс 100</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </RowItem>
        </Box>
      )}

      {tab === 2 && (
        <Box sx={{ bgcolor: alpha("#fff", 0.03), borderRadius: 4, border: `1px solid ${alpha("#fff", 0.08)}`, overflow: "hidden" }}>
          <SectionTitle sx={{ px: 3 }}>Управление данными</SectionTitle>
          <RowItem noDivider>
            <DeleteOutlineOutlinedIcon sx={{ color: colors.danger }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Удалить историю</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>Очистка транзакций за выбранный период</Typography>
            </Box>
            <Button variant="contained" color="error" onClick={() => setDeleteDataOpen(true)} sx={{ borderRadius: 3, fontWeight: 900 }}>Очистить</Button>
          </RowItem>
        </Box>
      )}

      {/* Модалки (Используют все переменные) */}
      <Dialog open={editNameOpen} onClose={() => setEditNameOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#1a1a1a", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Имя профиля</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Имя" fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField label="Фамилия" fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditNameOpen(false)} sx={{ color: alpha("#fff", 0.5) }}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveName} sx={{ bgcolor: colors.primary, fontWeight: 900 }}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editEmailOpen} onClose={() => setEditEmailOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#1a1a1a", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Смена Email</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <TextField label="Новый Email" fullWidth value={newEmail} onChange={(e) => setNewEmail(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditEmailOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveEmail}>Обновить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editPasswordOpen} onClose={() => setEditPasswordOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#1a1a1a", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Смена пароля</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField type="password" label="Текущий пароль" fullWidth value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <TextField type="password" label="Новый пароль" fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <TextField type="password" label="Повторите пароль" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditPasswordOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePassword}>Сменить пароль</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDataOpen} onClose={() => !deleting && setDeleteDataOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#1a1a1a", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Очистка данных</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <MonthPicker value={deleteMonth} onChange={setDeleteMonth} />
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel control={<Checkbox checked={deleteIncome} onChange={(e) => setDeleteIncome(e.target.checked)} sx={{ color: alpha("#fff", 0.3) }} />} label="Удалить доходы" />
            <FormControlLabel control={<Checkbox checked={deleteExpenses} onChange={(e) => setDeleteExpenses(e.target.checked)} sx={{ color: alpha("#fff", 0.3) }} />} label="Удалить расходы" />
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDataOpen(false)} disabled={deleting}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDeleteData} disabled={deleting}>{deleting ? "Удаление..." : "Удалить навсегда"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </PageWrap>
  );
}