// src/pages/Expenses/ExpensesPage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
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
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Autocomplete from '@mui/material/Autocomplete';

import EmptyState from '../../components/EmptyState';
import { useToast } from '../../contexts/ToastContext';

import { useExpensesApi } from "../../api/expensesApi";




import { useCurrency } from '../../contexts/CurrencyContext';

const COLORS = { expenses: '#F97316' };

const CATEGORY_OPTIONS = [
  'Продукты',
  'Транспорт',
  'Коммунальные услуги',
  'Здоровье',
  'Развлечения',
  'Другое',
];

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

const formatDateRuShort = (dateLike) => {
  const s = normalizeDateOnly(dateLike);
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${d}.${m}`;
};

const digitsOnly = (s) => String(s || '').replace(/\D/g, '');

const formatRuDateTyping = (input) => {
  const d = digitsOnly(input).slice(0, 8);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 4);
  const p3 = d.slice(4, 8);
  let out = p1;
  if (p2) out += '.' + p2;
  if (p3) out += '.' + p3;
  return out;
};

const ruToIsoStrict = (ru) => {
  const v = String(ru || '').trim();
  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return '';
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};

const isValidIsoDate = (iso) => {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
};

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const ymLabel = ({ year, month }) => `${String(month).padStart(2, '0')}.${year}`;

const isProxySerialization500 = (msg) =>
  String(msg || '').includes('ByteBuddyInterceptor');

export default function ExpensesPage() {
  const toast = useToast();
  const theme = useTheme();
  const { formatAmount } = useCurrency();

  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ---------- ПЕРСИСТЕНТНЫЙ МЕСЯЦ ДЛЯ РАСХОДОВ ----------
  const [ym, setYm] = useState(() => {
    const now = new Date();
    try {
      const raw = window.localStorage.getItem('fintracker:expenseMonth');
      if (!raw) {
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
      }
      const parsed = JSON.parse(raw);
      const y = Number(parsed?.year);
      const m = Number(parsed?.month);
      if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
        return { year: now.getFullYear(), month: now.getMonth() + 1 };
      }
      return { year: y, month: m };
    } catch {
      return { year: now.getFullYear(), month: now.getMonth() + 1 };
    }
  });

  const changeYm = useCallback((updater) => {
    setYm((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        window.localStorage.setItem('fintracker:expenseMonth', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  // ------------------------------------------------------

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dateErr, setDateErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    category: 'Продукты',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    dateRu: '',
  });

  const amountRef = useRef(null);

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
    const iso = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setDateErr('');
    setForm({
      amount: '',
      category: 'Продукты',
      description: '',
      date: iso,
      dateRu: formatDateRu(iso),
    });
    setOpen(true);
    setTimeout(() => {
      amountRef.current?.focus?.();
    }, 150);
  };

  const openEdit = (expense) => {
    const iso = normalizeDateOnly(expense?.date);
    setEditing(expense);
    setDateErr('');
    setForm({
      amount: expense?.amount ?? '',
      category: expense?.category ?? 'Продукты',
      description: expense?.description ?? '',
      date: iso,
      dateRu: formatDateRu(iso),
    });
    setOpen(true);
    setTimeout(() => {
      amountRef.current?.focus?.();
    }, 150);
  };

  const save = async () => {
    let attempted = false;

    try {
      setSaving(true);
      setError('');

      if (dateErr) throw new Error(dateErr);

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

      attempted = true;

      if (editing?.id) {
        await updateExpense(editing.id, payload);
        toast.success('Расход обновлён');
      } else {
        await createExpense(payload);
        toast.success('Расход добавлен');
      }

      setOpen(false);
      await load();
    } catch (e) {
      const msg = e?.message || 'Ошибка сохранения';

      if (isProxySerialization500(msg) && attempted) {
        setOpen(false);
        toast.success(editing?.id ? 'Расход обновлён' : 'Расход добавлен');

        await load();
      } else {
        setError(msg);
        toast.error(msg);
      }
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

  const total = useMemo(
    () => items.reduce((acc, x) => acc + Number(x.amount || 0), 0),
    [items]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#F8FAFC',
        px: { xs: 2, md: 3, lg: 4 },
        py: { xs: 2, md: 3 },
        width: '100%',
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: '#0F172A',
            }}
          >
            Расходы
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: '#64748B', mt: 0.5 }}
          >
            {ymLabel(ym)} · Итого: {formatAmount(total)}
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
              onClick={() => changeYm((s) => addMonthsYM(s, -1))}
              sx={{ minWidth: 44, px: 1.2 }}
            >
              ←
            </Button>

            <Chip
              label={ymLabel(ym)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                fontWeight: 800,
                bgcolor: '#FFFFFF',
              }}
            />

            <Button
              variant="outlined"
              onClick={() => changeYm((s) => addMonthsYM(s, +1))}
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
              bgcolor: COLORS.expenses,
              '&:hover': { bgcolor: '#EA580C' },
            }}
          >
            Добавить расход
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {error ? (
        <Typography
          variant="body2"
          sx={{ mb: 2, color: '#EF4444', fontWeight: 600 }}
        >
          {error}
        </Typography>
      ) : null}

      {/* Table */}
      {!loading && items.length === 0 ? (
        <EmptyState
          title="Пока нет записей"
          description="Добавь первую операцию — и тут появится список за выбранный месяц."
          actionLabel="Добавить"
          onAction={openCreate}
        />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{
              width: '100%',
              minWidth: { sm: 720 },
              tableLayout: { xs: 'fixed', sm: 'auto' },
              bgcolor: '#FFFFFF',
              '& th, & td': {
                px: { xs: 0.75, sm: 2 },
                py: { xs: 0.6, sm: 1 },
                fontSize: { xs: 12, sm: 13 },
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                verticalAlign: 'top',
                borderBottomColor: '#E2E8F0',
              },
              '& th': {
                fontWeight: 900,
                color: '#0F172A',
                whiteSpace: 'nowrap',
                bgcolor: '#F8FAFC',
              },
              '& td': {
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
                color: '#0F172A',
              },
              '& .MuiTableRow-root:last-of-type td': { borderBottom: 0 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: '20%', sm: 140 }, whiteSpace: 'nowrap' }}>
                  Дата
                </TableCell>
                <TableCell sx={{ width: { xs: '28%', sm: 160 }, whiteSpace: 'nowrap' }}>
                  Сумма
                </TableCell>
                <TableCell sx={{ width: { xs: '38%', sm: 200 } }}>
                  Категория
                </TableCell>
                <TableCell
                  sx={{
                    width: 260,
                    display: { xs: 'none', sm: 'table-cell' },
                  }}
                >
                  Описание
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    width: { xs: '14%', sm: 120 },
                    pr: { xs: 0.5, sm: 2 },
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    Действия
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((x) => (
                <TableRow key={x.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {isMobile ? formatDateRuShort(x.date) : formatDateRu(x.date)}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 900,
                      color: '#0F172A',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatAmount(Number(x.amount || 0))}
                  </TableCell>

                  <TableCell sx={{ pr: { xs: 0.5, sm: 2 } }}>
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
                        WebkitLineClamp: { xs: 2, sm: 1 },
                      }}
                      title={x.category || ''}
                    >
                      {x.category}
                    </Typography>

                    {isMobile ? (
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
                        title={x.description || ''}
                      >
                        {x.description}
                      </Typography>
                    ) : null}
                  </TableCell>

                  <TableCell
                    sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                    title={x.description || ''}
                  >
                    {x.description}
                  </TableCell>

                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton onClick={() => openEdit(x)} size="small">
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => remove(x)} size="small" color="error">
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Dialog */}
      <Dialog
        fullScreen={fullScreen}
        scroll="paper"
        open={open}
        onClose={() => (!saving ? setOpen(false) : null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editing ? 'Редактировать расход' : 'Добавить расход'}
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
            maxHeight: fullScreen ? 'calc(100vh - 140px)' : 520,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Сумма"
              inputRef={amountRef}
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              placeholder="1500.00"
              inputProps={{ inputMode: 'decimal' }}
              fullWidth
            />

            <Autocomplete
              freeSolo
              disablePortal
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(_e, newValue) => setForm((s) => ({ ...s, category: newValue ?? '' }))}
              onInputChange={(_e, newInput) => setForm((s) => ({ ...s, category: newInput }))}
              renderInput={(params) => <TextField {...params} label="Категория" fullWidth />}
            />

            <TextField
              label="Описание"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              fullWidth
            />

            <TextField
              label="Дата"
              value={form.dateRu || ''}
              onChange={(e) => {
                const ru = formatRuDateTyping(e.target.value);
                const iso = ruToIsoStrict(ru);

                let nextErr = '';
                if (ru.length === 10) {
                  if (!iso) nextErr = 'Неверный формат даты';
                  else if (!isValidIsoDate(iso)) nextErr = 'Такой даты не существует';
                }

                setDateErr(nextErr);

                setForm((s) => ({
                  ...s,
                  dateRu: ru,
                  date: iso && isValidIsoDate(iso) ? iso : s.date,
                }));
              }}
              placeholder="16.02.2026"
              inputProps={{ inputMode: 'numeric' }}
              fullWidth
              helperText={dateErr || 'Введите цифры: ДДММГГГГ (точки добавятся сами)'}
              error={Boolean(dateErr)}
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
            sx={{ bgcolor: COLORS.expenses, '&:hover': { bgcolor: '#EA580C' } }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
