// src/pages/Settings/SettingsPage.jsx
import React, { useState } from "react";
import {
  Box, Typography, Tabs, Tab, Switch, FormControl, Select, MenuItem,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Divider, Avatar, Stack, alpha
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useAuth } from "../../contexts/AuthContext";
import { bankingColors as colors } from "../../styles/bankingTokens";

export default function SettingsPage() {
  const { user, updateProfile, updateSettings, changePassword, deleteData } = useAuth();

  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, sev: "success", msg: "" });

  // Состояния для форм
  const [nameForm, setNameForm] = useState({ firstName: user?.firstName || "", lastName: user?.lastName || "" });
  const [passForm, setPassForm] = useState({ old: "", next: "" });
  const [delForm, setDelForm] = useState({ month: "", type: "all" });

  // Состояния диалогов
  const [dialogs, setDialogs] = useState({ name: false, pass: false, del: false });

  const toggleDialog = (key, val) => setDialogs(prev => ({ ...prev, [key]: val }));
  const showSnack = (msg, sev = "success") => setSnack({ open: true, msg, sev });

  // Хендлеры
  const handleSaveProfile = async () => {
    const res = await updateProfile(nameForm);
    if (res.success) { showSnack("Профиль обновлен"); toggleDialog('name', false); }
    else showSnack(res.error, "error");
  };

  const handleUpdatePass = async () => {
    const res = await changePassword(passForm.old, passForm.next);
    if (res.success) { showSnack("Пароль изменен"); toggleDialog('pass', false); setPassForm({old:"", next:""}); }
    else showSnack(res.error, "error");
  };

  const handleToggleHide = (val) => updateSettings({ ...user?.settings, hideAmounts: val });
  const handleCurrency = (val) => updateSettings({ ...user?.settings, displayCurrency: val });

  const handleDeleteData = async () => {
    if (!delForm.month) return showSnack("Выберите месяц", "error");
    const [year, month] = delForm.month.split("-"); // "2024-05" -> ["2024", "05"]
    const res = await deleteData(year, month, delForm.type);
    if (res.success) { showSnack("Данные удалены"); toggleDialog('del', false); }
    else showSnack(res.error, "error");
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto", color: "#fff" }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 3 }}>Настройки</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 4 }}>
        <Tab label="Аккаунт" sx={{ color: "#fff" }} />
        <Tab label="Интерфейс" sx={{ color: "#fff" }} />
        <Tab label="Данные" sx={{ color: "#fff" }} />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: colors.primary, color: '#000', fontWeight: 800 }}>{user?.firstName?.[0]}</Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 800 }}>{user?.firstName} {user?.lastName}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.6 }}>{user?.email}</Typography>
            </Box>
            <Button variant="outlined" onClick={() => toggleDialog('name', true)}>Изменить</Button>
            <Button variant="outlined" onClick={() => toggleDialog('pass', true)}>Пароль</Button>
          </Box>
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={2} divider={<Divider sx={{ borderColor: alpha("#fff", 0.1) }} />}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>Скрывать суммы в приложении</Typography>
            <Switch checked={!!user?.settings?.hideAmounts} onChange={e => handleToggleHide(e.target.checked)} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>Валюта по умолчанию</Typography>
            <Select
              value={user?.settings?.displayCurrency || "RUB"}
              size="small"
              onChange={e => handleCurrency(e.target.value)}
              sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: alpha("#fff", 0.2) } }}
            >
              <MenuItem value="RUB">RUB (₽)</MenuItem>
              <MenuItem value="USD">USD ($)</MenuItem>
            </Select>
          </Box>
        </Stack>
      )}

      {tab === 2 && (
        <Box sx={{ py: 2 }}>
          <Alert severity="error" variant="outlined" sx={{ color: "#fff", mb: 3 }}>
            Удаление данных нельзя отменить. Будьте внимательны.
          </Alert>
          <Button variant="contained" color="error" startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => toggleDialog('del', true)}>
            Очистить данные за месяц
          </Button>
        </Box>
      )}

      {/* --- МОДАЛКИ --- */}
      <Dialog open={dialogs.name} onClose={() => toggleDialog('name', false)}>
        <DialogTitle>Редактировать профиль</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Имя" fullWidth value={nameForm.firstName} onChange={e => setNameForm({...nameForm, firstName: e.target.value})} />
            <TextField label="Фамилия" fullWidth value={nameForm.lastName} onChange={e => setNameForm({...nameForm, lastName: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => toggleDialog('name', false)}>Отмена</Button>
          <Button onClick={handleSaveProfile} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.pass} onClose={() => toggleDialog('pass', false)}>
        <DialogTitle>Смена пароля</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Текущий пароль" type="password" fullWidth value={passForm.old} onChange={e => setPassForm({...passForm, old: e.target.value})} />
            <TextField label="Новый пароль" type="password" fullWidth value={passForm.next} onChange={e => setPassForm({...passForm, next: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => toggleDialog('pass', false)}>Отмена</Button>
          <Button onClick={handleUpdatePass} variant="contained">Обновить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialogs.del} onClose={() => toggleDialog('del', false)}>
        <DialogTitle>Удаление записей</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField type="month" fullWidth value={delForm.month} onChange={e => setDelForm({...delForm, month: e.target.value})} />
            <Select value={delForm.type} fullWidth onChange={e => setDelForm({...delForm, type: e.target.value})}>
              <MenuItem value="all">Все данные</MenuItem>
              <MenuItem value="income">Только доходы</MenuItem>
              <MenuItem value="expenses">Только расходы</MenuItem>
            </Select>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => toggleDialog('del', false)}>Отмена</Button>
          <Button onClick={handleDeleteData} variant="contained" color="error">Удалить навсегда</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })}>
        <Alert severity={snack.sev} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}