import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Chip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
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
import { bankingColors as colors } from '../../styles/bankingTokens';

const COLORS = { income: colors.primary };

const CATEGORY_OPTIONS = ['Работа', 'Подработка', 'Вклады', 'Инвестиции', 'Подарки', 'Другое'];
const SOURCE_OPTIONS = ['Зарплата', 'Премия', 'Проценты', 'Дивиденды', 'Бизнес', 'Другое'];

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

const isProxySerialization500 = (msg) =>
  String(msg || '').includes('ByteBuddyInterceptor');

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
  const [dateErr, setDateErr] = useState('');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    amount: '',
    category: 'Работа',
    source: 'Зарплата',
    date: new Date().toISOString().slice(0, 10),
    dateRu: '',
  });

  const amountRef = useRef(null);

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
    const iso = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setDateErr('');
    setForm({
      amount: '',
      category: 'Работа',
      source: 'Зарплата',
      date: iso,
      dateRu: formatDateRu(iso),
    });
    setOpen(true);
    setTimeout(() => {
      amountRef.current?.focus?.();
    }, 150);
  };

  const openEdit = (income) => {
    const iso = normalizeDateOnly(income?.date);
    setEditing(income);
    setDateErr('');
    setForm({
      amount: income?.amount ?? '',
      category: income?.category ?? 'Работа',
      source: income?.source ?? 'Зарплата',
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: colors.bg0,
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
              fontWeight: 980,
              color: colors.text,
              letterSpacing: -0.3,
            }}
          >
            Доходы
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.muted,
              mt: 0.5,
              fontWeight: 600,
            }}
          >
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
              sx={{
                minWidth: 44,
                px: 1.2,
                borderColor: colors.border,
                color: colors.muted,
              }}
            >
              ←
            </Button>

            <Chip
              label={ymLabel(ym)}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                fontWeight: 800,
                bgcolor: alpha(colors.card2, 0.9),
                color: colors.text,
                borderRadius: 999,
              }}
            />

            <Button
              variant="outlined"
              onClick={() => setYm((s) => addMonthsYM(s, +1))}
              sx={{
                minWidth: 44,
                px: 1.2,
                borderColor: colors.border,
                color: colors.muted,
              }}
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

      {/* Error card */}
      {error ? (
        <Card
          variant="outlined"
          sx={{
            mb: 2,
            borderRadius: 3,
            borderColor: alpha(colors.danger || '#F97373', 0.5),
            bgcolor: alpha('#0F172A', 0.95),
          }}
        >
          <CardContent sx={{ py: 1.5 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </CardContent>
        </Card>
      ) : null}

      {/* List card – центр не заужен, просто панель */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: colors.border,
          bgcolor: colors.card,
          boxShadow: '0 18px 50px rgba(0,0,0,0.6)',
        }}
      >
        <CardContent sx={{ px: { xs: 1, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ px: { xs: 1, sm: 1 } }}>
            <Typography
              sx={{
                fontWeight: 880,
                color: colors.text,
                fontSize: 14,
                letterSpacing: 0.3,
              }}
            >
              Список
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5, borderColor: colors.border }} />

          {!loading && items.length === 0 ? (
            <Box sx={{ px: { xs: 1, sm: 1 } }}>
              <EmptyState
                title="Пока нет записей"
                description="Добавь первую операцию — и тут появится список за выбранный месяц."
                actionLabel="Добавить"
                onAction={openCreate}
              />
            </Box>
          ) : (
            <Box
              sx={{
                px: { xs: 0.5, sm: 1 },
                overflowX: 'hidden',
              }}
            >
              <Table
                size="small"
                sx={{
                  width: '100%',
                  minWidth: { sm: 720 },
                  tableLayout: { xs: 'fixed', sm: 'auto' },
                  '& th, & td': {
                    px: { xs: 0.75, sm: 2 },
                    py: { xs: 0.6, sm: 1 },
                    fontSize: { xs: 12, sm: 13 },
                    lineHeight: 1.15,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    verticalAlign: 'top',
                    borderBottomColor: alpha('#FFFFFF', 0.06),
                  },
                  '& th': {
                    fontWeight: 900,
                    color: colors.text,
                    whiteSpace: 'nowrap',
                    bgcolor: colors.card2,
                  },
                  '& td': {
                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                    color: colors.muted,
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
                        width: 200,
                        display: { xs: 'none', sm: 'table-cell' },
                      }}
                    >
                      Источник
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
                          color: colors.text,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {fmtRub.format(Number(x.amount || 0))}
                      </TableCell>

                      <TableCell sx={{ pr: { xs: 0.5, sm: 2 } }}>
                        <Typography
                          component="div"
                          sx={{
                            fontSize: { xs: 12, sm: 13 },
                            fontWeight: 800,
                            color: colors.text,
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
                              color: colors.muted,
                              lineHeight: 1.15,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={x.source || ''}
                          >
                            {x.source}
                          </Typography>
                        ) : null}
                      </TableCell>

                      <TableCell
                        sx={{ display: { xs: 'none', sm: 'table-cell' } }}
                        title={x.source || ''}
                      >
                        {x.source}
                      </TableCell>

                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton onClick={() => openEdit(x)} size="small" sx={{ color: colors.muted }}>
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
        </CardContent>
      </Card>

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
          {editing ? 'Редактировать доход' : 'Добавить доход'}
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
              placeholder="50000.00"
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

            <Autocomplete
              freeSolo
              disablePortal
              options={SOURCE_OPTIONS}
              value={form.source}
              onChange={(_e, newValue) => setForm((s) => ({ ...s, source: newValue ?? '' }))}
              onInputChange={(_e, newInput) => setForm((s) => ({ ...s, source: newInput }))}
              renderInput={(params) => <TextField {...params} label="Источник" fullWidth />}
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
            sx={{
              bgcolor: COLORS.income,
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
