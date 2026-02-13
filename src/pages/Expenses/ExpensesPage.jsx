import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  MenuItem,
  Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Autocomplete from '@mui/material/Autocomplete';

import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';

// ВАЖНО: используем me-endpoints
import {
  getMyExpensesByMonth,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../api/expensesApi';

const COLORS = { expenses: '#F97316' };

const toAmountString = (v) => String(v ?? '').trim().replace(',', '.');

const normalizeDateOnly = (d) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  const s = String(d);
  return s.includes('T') ? s.slice(0, 10) : s;
};

const CATEGORY_OPTIONS = [
  'Продукты',
  'Транспорт',
  'Дом',
  'Развлечения',
  'Здоровье',
  'Другое',
];

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const ymLabel = ({ year, month }) => `${String(month).padStart(2, '0')}.${year}`;

const ymFromDate = (yyyyMmDd) => {
  const s = normalizeDateOnly(yyyyMmDd);
  const [y, m] = s.split('-');
  return { year: Number(y), month: Number(m) };
};

export default function ExpensesPage() {
  const toast = useToast();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [ym, setYm] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const fmtRub = useMemo(
    () =>
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
      }),
    []
  );

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    category: 'Продукты',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getMyExpensesByMonth(ym.year, ym.month, 0, 50);
      const data = res.data;
      setItems(data?.content ?? []);
    } catch (e) {
      const msg = e?.message || 'Ошибка загрузки расходов';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast, ym.year, ym.month]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      amount: '',
      category: 'Продукты',
      description: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setForm({
      amount: expense?.amount ?? '',
      category: expense?.category ?? 'Продукты',
      description: expense?.description ?? '',
      date: normalizeDateOnly(expense?.date),
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');

      const payload = {
        amount: toAmountString(form.amount),
        category: String(form.category).trim(),
        description: String(form.description).trim(),
        date: normalizeDateOnly(form.date),
      };

      const amountNum = Number(payload.amount);
      if (!Number.isFinite(amountNum) || amountNum < 0.01)
        throw new Error('Сумма должна быть больше 0');
      if (!payload.category) throw new Error('Категория обязательна');
      if (!payload.date) throw new Error('Дата обязательна');

      if (editing?.id) {
        await updateExpense(editing.id, payload);
        toast.success('Расход обновлён');
      } else {
        await createExpense(payload);
        toast.success('Расход добавлен');
      }

      const target = ymFromDate(payload.date);
      setOpen(false);

      if (target.year !== ym.year || target.month !== ym.month) {
        setYm(target);
        return;
      }

      await load();
    } catch (e) {
      const msg = e?.message || 'Ошибка сохранения';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (expense) => {
    try {
      setError('');
      await deleteExpense(expense.id);
      toast.success('Расход удалён');
      await load();
    } catch (e) {
      const msg = e?.message || 'Ошибка удаления';
      setError(msg);
      toast.error(msg);
    }
  };

  const total = items.reduce((acc, x) => acc + Number(x.amount || 0), 0);

  return (
    <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh', p: { xs: 2, md: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 2 }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A' }}>
            Расходы
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
            {ymLabel(ym)} · Итого: {fmtRub.format(total)}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="outlined"
              onClick={() => setYm((s) => addMonthsYM(s, -1))}
            >
              ←
            </Button>
            <Chip
              label={ymLabel(ym)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            />
            <Button
              variant="outlined"
              onClick={() => setYm((s) => addMonthsYM(s, +1))}
            >
              →
            </Button>
          </Stack>

          <Button
            onClick={openCreate}
            variant="contained"
            fullWidth
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: 999,
              px: 2.2,
              bgcolor: COLORS.expenses,
              '&:hover': { bgcolor: '#EA580C' },
            }}
          >
            Добавить расход
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            borderRadius: 3,
            borderColor: '#FECACA',
            bgcolor: '#FFFFFF',
          }}
        >
          <CardContent sx={{ py: 1.5 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: '#E2E8F0',
          bgcolor: '#FFFFFF',
        }}
      >
        <CardContent>
          <Typography sx={{ fontWeight: 850, color: '#0F172A' }}>Список</Typography>
          <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

          {!loading && items.length === 0 ? (
            <EmptyState
              title="Пока нет записей"
              description="Добавь первую операцию — и тут появится список за выбранный месяц."
              actionLabel="Добавить"
              onAction={openCreate}
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Сумма</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell>{normalizeDateOnly(x.date)}</TableCell>
                      <TableCell>
                        {fmtRub.format(Number(x.amount || 0))}
                      </TableCell>
                      <TableCell>{x.category}</TableCell>
                      <TableCell>{x.description}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => openEdit(x)} size="small">
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => remove(x)}
                          size="small"
                          color="error"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={() => (!saving ? setOpen(false) : null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? 'Редактировать расход' : 'Добавить расход'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Сумма"
              value={form.amount}
              onChange={(e) =>
                setForm((s) => ({ ...s, amount: e.target.value }))
              }
              placeholder="1500.00"
              inputProps={{ inputMode: 'decimal' }}
              fullWidth
            />

            <Autocomplete
              freeSolo
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(_e, newValue) =>
                setForm((s) => ({ ...s, category: newValue ?? '' }))
              }
              onInputChange={(_e, newInput) =>
                setForm((s) => ({ ...s, category: newInput }))
              }
              renderInput={(params) => (
                <TextField {...params} label="Категория" fullWidth />
              )}
            />

            <TextField
              label="Описание"
              value={form.description}
              onChange={(e) =>
                setForm((s) => ({ ...s, description: e.target.value }))
              }
              fullWidth
            />

            <TextField
              label="Дата"
              type="date"
              value={normalizeDateOnly(form.date)}
              onChange={(e) =>
                setForm((s) => ({ ...s, date: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            flexDirection: fullScreen ? 'column' : 'row',
            gap: 1,
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            disabled={saving}
            fullWidth={fullScreen}
          >
            Отмена
          </Button>
          <Button
            onClick={save}
            variant="contained"
            disabled={saving}
            fullWidth={fullScreen}
            sx={{
              bgcolor: COLORS.expenses,
              '&:hover': { bgcolor: '#EA580C' },
            }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
