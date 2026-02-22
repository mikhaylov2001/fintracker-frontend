import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Typography, Tabs, Tab, Switch, FormControl, Select, MenuItem,
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
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined"; // Вернул для блока "О приложении"
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";

import { useAuth } from "../../contexts/AuthContext";
import { bankingColors as colors } from "../../styles/bankingTokens";

// --- Helpers ---
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
      {Object.entries(months).sort(([a], [b]) => Number(b) - Number(a)).map(([year, monthList]) => (
        <Box key={year} sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: alpha("#000", 0.5), mb: 0.75, display: "block" }}>{year}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {monthList.map((m) => {
              const v = ymValue(Number(year), m);
              const selected = value === v;
              return (
                <Chip key={m} label={MONTH_NAMES[m - 1]} size="small" onClick={() => onChange(v)}
                  sx={{ fontWeight: 900, bgcolor: selected ? colors.primary : alpha("#000", 0.07), color: selected ? "#fff" : "inherit" }}
                />
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

const PageWrap = ({ children }) => <Box sx={{ width: "100%", mx: "auto", maxWidth: { xs: "100%", sm: 720, md: 900, lg: 1040 }, userSelect: "none" }}>{children}</PageWrap>;

const SectionTitle = ({ children, sx }) => (
  <Typography sx={{ fontSize: 13, fontWeight: 950, color: alpha("#fff", 0.45), mb: 2, mt: 4, textTransform: "uppercase", letterSpacing: 1, ...sx }}>
    {children}
  </Typography>
);

const RowItem = ({ children, noDivider }) => (
  <>
    <Box sx={{ py: 2.5, px: 1, display: "flex", alignItems: "center", gap: 2.5 }}>{children}</Box>
    {!noDivider && <Divider sx={{ borderColor: alpha("#fff", 0.08) }} />}
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
      showSnack("success", "Профиль обновлен");
      setEditNameOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  const handleSaveEmail = async () => {
    const res = await updateProfile({ email: newEmail });
    if (res.success) {
      showSnack("success", "Email успешно изменен");
      setEditEmailOpen(false);
    } else {
      showSnack("error", res.error);
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) return showSnack("error", "Пароли не совпадают");
    const res = await updateProfile({ currentPassword, newPassword });
    if (res.success) {
      showSnack("success", "Пароль изменен");
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
      const p = parseYearMonth(deleteMonth);
      showSnack("success", `Данные за ${ymLabel(p.year, p.month)} удалены`);
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
      <Box sx={{ mb: 4, pt: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>Настройки</Typography>
      </Box>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 4, "& .MuiTabs-indicator": { bgcolor: colors.primary, height: 3 } }}>
        <Tab label="Аккаунт" sx={{ color: "#fff", fontWeight: 900, textTransform: "none", fontSize: 16, mr: 2 }} />
        <Tab label="Интерфейс" sx={{ color: "#fff", fontWeight: 900, textTransform: "none", fontSize: 16, mr: 2 }} />
        <Tab label="Данные" sx={{ color: "#fff", fontWeight: 900, textTransform: "none", fontSize: 16 }} />
      </Tabs>

      {tab === 0 && (
        <Box>
          <SectionTitle>Профиль</SectionTitle>
          <RowItem>
            <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(colors.primary, 0.15), color: colors.primary, fontWeight: 900, fontSize: 24 }}>{user?.firstName?.[0] || "M"}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff", fontSize: 18 }}>{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5), fontWeight: 600 }}>{user?.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditNameOpen(true)} startIcon={<EditOutlinedIcon />} sx={{ borderRadius: 10, borderColor: alpha("#fff", 0.2), color: "#fff", textTransform: "none", fontWeight: 900, px: 3 }}>Изменить</Button>
          </RowItem>

          <SectionTitle>Безопасность</SectionTitle>
          <RowItem>
            <EmailOutlinedIcon sx={{ color: alpha("#fff", 0.6) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Email</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>{user?.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditEmailOpen(true)} sx={{ borderRadius: 10, borderColor: alpha("#fff", 0.2), color: "#fff", textTransform: "none", fontWeight: 900, px: 3 }}>Изменить</Button>
          </RowItem>
          <RowItem>
            <LockOutlinedIcon sx={{ color: alpha("#fff", 0.6) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Пароль</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>••••••••</Typography>
            </Box>
            <Button variant="outlined" onClick={() => setEditPasswordOpen(true)} sx={{ borderRadius: 10, borderColor: alpha("#fff", 0.2), color: "#fff", textTransform: "none", fontWeight: 900, px: 3 }}>Изменить</Button>
          </RowItem>

          <SectionTitle>О приложении</SectionTitle>
          <RowItem noDivider>
            <InfoOutlinedIcon sx={{ color: alpha("#fff", 0.6) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>FinTrackerPro</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.5) }}>Версия 1.0.0</Typography>
              <Typography variant="caption" sx={{ color: alpha("#fff", 0.35), display: "block", mt: 0.5 }}>Создатель: Дмитрий Михайлов</Typography>
            </Box>
          </RowItem>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <SectionTitle>Отображение</SectionTitle>
          <RowItem>
            <PaletteOutlinedIcon sx={{ color: alpha("#fff", 0.6) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Скрывать суммы</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.4) }}>Полезно при показе экрана другим</Typography>
            </Box>
            <Switch checked={user?.hideAmounts || false} onChange={(e) => updateProfile({ hideAmounts: e.target.checked })} color="primary" />
          </RowItem>

          <SectionTitle>Валюта</SectionTitle>
          <Box sx={{ p: 1 }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <Select 
                value={user?.currency || "RUB"} 
                onChange={(e) => updateProfile({ currency: e.target.value })}
                sx={{ bgcolor: alpha("#fff", 0.05), color: "#fff", borderRadius: 3, ".MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.1) } }}
              >
                <MenuItem value="RUB">RUB — ₽</MenuItem>
                <MenuItem value="USD">USD — $</MenuItem>
                <MenuItem value="EUR">EUR — €</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: alpha("#fff", 0.4), display: "block", mb: 3 }}>
              Данные хранятся в базовой валюте, здесь только отображение и конвертация.
            </Typography>

            <Box sx={{ p: 2.5, borderRadius: 4, border: `1px solid ${alpha("#fff", 0.1)}`, bgcolor: alpha("#fff", 0.02) }}>
              <Typography sx={{ fontSize: 12, fontWeight: 950, color: alpha("#fff", 0.5), mb: 1.5, textTransform: "uppercase" }}>Текущие курсы (пример)</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, mb: 0.5 }}>1 USD ≈ 90 ₽</Typography>
              <Typography sx={{ color: "#fff", fontWeight: 800, mb: 1.5 }}>1 EUR ≈ 100 ₽</Typography>
              <Typography sx={{ fontSize: 11, color: alpha("#fff", 0.3) }}>Курс указан для ориентира, реальные значения могут отличаться.</Typography>
            </Box>
          </Box>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <SectionTitle>Удаление данных</SectionTitle>
          <RowItem noDivider>
            <DeleteOutlineOutlinedIcon sx={{ color: alpha("#fff", 0.6) }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 900, color: "#fff" }}>Удалить данные за месяц</Typography>
              <Typography variant="body2" sx={{ color: alpha("#fff", 0.4), mb: 2 }}>Выберите месяц и тип данных для удаления</Typography>
              <Button fullWidth variant="outlined" onClick={() => setDeleteDataOpen(true)} sx={{ borderRadius: 10, borderColor: alpha("#fff", 0.1), color: "#fff", textTransform: "none", fontWeight: 900, py: 1.2 }}>Открыть выбор</Button>
            </Box>
          </RowItem>
        </Box>
      )}

      {/* Модалки те же, просто убедился что они работают */}
      <Dialog open={editNameOpen} onClose={() => setEditNameOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#121212", color: "#fff", width: "100%", maxWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Изменить имя</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Имя" fullWidth value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField label="Фамилия" fullWidth value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditNameOpen(false)} sx={{ color: alpha("#fff", 0.5) }}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveName} sx={{ bgcolor: colors.primary, fontWeight: 900 }}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editEmailOpen} onClose={() => setEditEmailOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#121212", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Новый Email</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <TextField label="Email" fullWidth value={newEmail} onChange={(e) => setNewEmail(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditEmailOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveEmail}>Обновить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editPasswordOpen} onClose={() => setEditPasswordOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#121212", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Смена пароля</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField type="password" label="Текущий пароль" fullWidth value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <TextField type="password" label="Новый пароль" fullWidth value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <TextField type="password" label="Повторите" fullWidth value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setEditPasswordOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSavePassword}>Сменить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDataOpen} onClose={() => !deleting && setDeleteDataOpen(false)} PaperProps={{ sx: { borderRadius: 4, bgcolor: "#121212", color: "#fff" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Удаление данных</DialogTitle>
        <DialogContent dividers sx={{ borderColor: alpha("#fff", 0.1) }}>
          <MonthPicker value={deleteMonth} onChange={setDeleteMonth} />
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel control={<Checkbox checked={deleteIncome} onChange={(e) => setDeleteIncome(e.target.checked)} sx={{ color: "#fff" }} />} label="Доходы" />
            <FormControlLabel control={<Checkbox checked={deleteExpenses} onChange={(e) => setDeleteExpenses(e.target.checked)} sx={{ color: "#fff" }} />} label="Расходы" />
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDataOpen(false)} disabled={deleting}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDeleteData} disabled={deleting}>Удалить</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.severity} variant="filled">{snack.message}</Alert>
      </Snackbar>
    </PageWrap>
  );
}