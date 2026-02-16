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
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Autocomplete from '@mui/material/Autocomplete';

import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';

import {
  createIncome,
  deleteIncome,
  getMyIncomesByMonth,
  updateIncome,
} from '../../api/incomeApi';

const COLORS = { income: '#22C55E' };

const toAmountString = (v) => String(v ?? '').trim().replace(',', '.');

const normalizeDateOnly = (d) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  const s = String(d);
  return s.includes('T') ? s.slice(0, 10) : s;
};

const formatDateRu = (dateLike) => {
  const s = normalizeDateOnly(dateLike); // YYYY-MM-DD
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${d}.${m}.${y}`;
};

const isProxySerialization500 = (msg) =>
  String(msg || '').includes('ByteBuddyInterceptor');

const CATEGORY_OPTIONS = ['Работа', 'Фриланс', 'Инвестиции', 'Подарки', 'Другое'];
const SOURCE_OPTIONS = [
  'Зарплата',
  'Премия',
  'Дивиденды',
  'Проценты',
  'Подработка',
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

export default function IncomePage() {
  const toast = useToast();
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    category: 'Работа',
    source: 'Зарплата',
    date: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getMyIncomesByMonth(ym.year, ym.month, 0, 50);
      const data = res.data;
      setItems(data?.content ?? []);
    } catch (e) {
      const msg = e?.message || 'Ошибка загрузки доходов';
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
      category: 'Работа',
      source: 'Зарплата',
      date: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (income) => {
    setEditing(income);
    setForm({
      amount: income?.amount ?? '',
      category: income?.category ?? 'Работа',
      source: income?.source ?? 'Зарплата',
      date: normalizeDateOnly(income?.date),
    });
    setOpen(true);
  };

  const save = async () => {
    let attempted = false;

    try {
      setSaving(true);
      setError('');

      const payload = {
        amount: toAmountString(form.amount),
        category: String(form.category).trim(),
        source: String(form.source).trim(),
        date: normalizeDateOnly(form.date),
      };

      const amountNum = Number(payload.amount);
      if (!Number.isFinite(amountNum) || amountNum < 0.01)
        throw new Error('Сумма должна быть больше 0');
      if (!payload.category) throw new Error('Категория обязательна');
      if (!payload.source) throw new Error('Источник обязателен');
      if (!payload.date) throw new Error('Дата обязательна');

      attempted = true;

      if (editing?.id) {
        await updateIncome(editing.id, payload);
        toast.success('Доход обновлён');
      } else {
        await createIncome(payload);
        toast.success('Доход добавлен');
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

      if (isProxySerialization500(msg) && attempted) {
        setOpen(false);
        toast.success(editing?.id ? 'Доход обновлён' : 'Доход добавлен');

        const target = ymFromDate(form.date);
        if (target.year !== ym.year || target.month !== ym.month) {
          setYm(target);
          return;
        }

        await load();
      } else {
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (income) => {
    try {
      setError('');
      await deleteIncome(income.id);
      toast.success('Доход удалён');
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
            Доходы
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
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              onClick={() => setYm((s) => addMonthsYM(s, -1))}
              sx={{ minWidth: 44, px: 1.2 }}
            >
              ←
            </Button>

            <Chip label={ymLabel(ym)} sx={{ width: { xs: '100%', sm: 'auto' }, fontWeight: 800 }} />

            <Button
              variant="outlined"
              onClick={() => setYm((s) => addMonthsYM(s, +1))}
              sx={{ minWidth: 44, px: 1.2 }}
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
              bgcolor: COLORS.income,
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            Добавить доход
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Card
          variant="outlined"
          sx={{ mb: 2, borderRadius: 3, borderColor: '#FECACA', bgcolor: '#FFFFFF' }}
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
          overflow: 'hidden',
          mx: { xs: -2, md: 0 },
          width: { xs: 'calc(100% + 32px)', md: 'auto' },
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ px: { xs: 2, md: 2.5 }, pt: { xs: 2, md: 2.25 } }}>
            <Typography sx={{ fontWeight: 850, color: '#0F172A' }}>Список</Typography>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: '#E2E8F0' }} />

          {!loading && items.length === 0 ? (
            <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2 }}>
              <EmptyState
                title="Пока нет записей"
                description="Добавь первую операцию — и тут появится список за выбранный месяц."
                actionLabel="Добавить"
                onAction={openCreate}
              />
            </Box>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'hidden', pb: 1 }}>
              <Table
                size="small"
                sx={{
                  width: '100%',
                  tableLayout: 'fixed',
                  '& .MuiTableCell-root': { borderBottom: 0 }, // без линий [web:1006]

                  '& th, & td': {
                    px: { xs: 1.25, sm: 2.5 },
                    py: { xs: 0.9, sm: 1.05 },
                    fontSize: { xs: 12, sm: 13 },
                    lineHeight: 1.15,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    verticalAlign: 'top',
                  },
                  '& th': { fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap', bgcolor: '#FFFFFF' },
                  '& td': { whiteSpace: 'normal' },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: { xs: 98, sm: 140 }, whiteSpace: 'nowrap' }}>
                      Дата
                    </TableCell>

                    <TableCell sx={{ width: { xs: 110, sm: 160 }, whiteSpace: 'nowrap' }}>
                      Сумма
                    </TableCell>

                    <TableCell sx={{ width: 'auto' }}>
                      Категория
                    </TableCell>

                    {/* ВАЖНО: фиксируем ширину, чтобы 2 кнопки всегда влезали */}
                    <TableCell
                      align="right"
                      sx={{
                        width: { xs: 88, sm: 120 },
                        pr: { xs: 1, sm: 2.5 },
                        color: 'transparent',
                        userSelect: 'none',
                      }}
                    >
                      —
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {items.map((x) => (
                    <TableRow key={x.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateRu(x.date)}
                      </TableCell>

                      <TableCell sx={{ fontWeight: 900, color: '#0F172A', whiteSpace: 'nowrap' }}>
                        {fmtRub.format(Number(x.amount || 0))}
                      </TableCell>

                      <TableCell>
                        <Typography
                          component="div"
                          sx={{
                            fontSize: { xs: 12, sm: 13 },
                            fontWeight: 800,
                            color: '#0F172A',
                            lineHeight: 1.15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                          }}
                          title={x.category || ''}
                        >
                          {x.category}
                        </Typography>

                        <Typography
                          component="div"
                          sx={{
                            mt: 0.2,
                            fontSize: 11,
                            color: '#64748B',
                            lineHeight: 1.15,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={x.source || ''}
                        >
                          {x.source}
                        </Typography>
                      </TableCell>

                      {/* кнопки редактирования ВИДНЫ на всех устройствах */}
                      <TableCell
                        align="right"
                        sx={{
                          width: { xs: 88, sm: 120 },
                          pr: { xs: 1, sm: 2.5 },
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                      >
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                          <IconButton
                            onClick={() => openEdit(x)}
                            size="small"
                            sx={{
                              p: 0.6,
                              bgcolor: 'rgba(15, 23, 42, 0.06)',
                              borderRadius: 2,
                              '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.10)' },
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            onClick={() => remove(x)}
                            size="small"
                            sx={{
                              p: 0.6,
                              bgcolor: 'rgba(239, 68, 68, 0.10)',
                              borderRadius: 2,
                              color: '#EF4444',
                              '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.16)' },
                            }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Stack>
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
        <DialogTitle>{editing ? 'Редактировать доход' : 'Добавить доход'}</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Сумма"
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              placeholder="50000.00"
              inputProps={{ inputMode: 'decimal' }}
              fullWidth
            />

            <Autocomplete
              freeSolo
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(_e, newValue) => setForm((s) => ({ ...s, category: newValue ?? '' }))}
              onInputChange={(_e, newInput) => setForm((s) => ({ ...s, category: newInput }))}
              renderInput={(params) => <TextField {...params} label="Категория" fullWidth />}
            />

            <TextField
              select
              label="Источник"
              value={form.source}
              onChange={(e) => setForm((s) => ({ ...s, source: e.target.value }))}
              fullWidth
            >
              {SOURCE_OPTIONS.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Дата"
              type="date"
              value={normalizeDateOnly(form.date)}
              onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
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
          <Button onClick={() => setOpen(false)} variant="outlined" disabled={saving} fullWidth={fullScreen}>
            Отмена
          </Button>
          <Button
            onClick={save}
            variant="contained"
            disabled={saving}
            fullWidth={fullScreen}
            sx={{ bgcolor: COLORS.income, '&:hover': { bgcolor: '#16A34A' } }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
