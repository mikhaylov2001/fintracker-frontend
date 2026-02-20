// src/pages/Income/IncomePage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Autocomplete from "@mui/material/Autocomplete";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

import EmptyState from "../../components/EmptyState";
import { useToast } from "../../contexts/ToastContext";

import { useIncomeApi } from "../../api/incomeApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";

import {
  bankingColors,
  pageBackgroundSx,
} from "../../styles/bankingTokens";

const COLORS = { income: bankingColors.primary };

const CATEGORY_OPTIONS = [
  "Работа",
  "Подработка",
  "Вклады",
  "Инвестиции",
  "Подарки",
  "Другое",
];
const SOURCE_OPTIONS = [
  "Зарплата",
  "Премия",
  "Проценты",
  "Дивиденды",
  "Бизнес",
  "Другое",
];

const toAmountString = (v) => String(v ?? "").trim().replace(",", ".");

const normalizeDateOnly = (d) => {
  if (!d) return new Date().toISOString().slice(0, 10);
  const s = String(d);
  return s.includes("T") ? s.slice(0, 10) : s;
};

const formatDateRu = (dateLike) => {
  const s = normalizeDateOnly(dateLike);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}.${m}.${y}`;
};

const formatDateRuShort = (dateLike) => {
  const s = normalizeDateOnly(dateLike);
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}.${m}`;
};

const digitsOnly = (s) => String(s || "").replace(/\D/g, "");

const formatRuDateTyping = (input) => {
  const d = digitsOnly(input).slice(0, 8);
  const p1 = d.slice(0, 2);
  const p2 = d.slice(2, 4);
  const p3 = d.slice(4, 8);
  let out = p1;
  if (p2) out += "." + p2;
  if (p3) out += "." + p3;
  return out;
};

const ruToIsoStrict = (ru) => {
  const v = String(ru || "").trim();
  const m = v.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
};

const isValidIsoDate = (iso) => {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === mo - 1 &&
    dt.getDate() === d
  );
};

const isProxySerialization500 = (msg) =>
  String(msg || "").includes("ByteBuddyInterceptor");

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const ymLabel = ({ year, month }) =>
  `${String(month).padStart(2, "0")}.${year}`;

export default function IncomePage() {
  const toast = useToast();
  const theme = useTheme();
  const { formatAmount } = useCurrency();
  const { user } = useAuth();
  const userId = user?.id;

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const incomeApi = useIncomeApi();
  const getMyIncomesByMonthRef = useRef(incomeApi.getMyIncomesByMonth);

  const [ym, setYm] = useState(() => {
    const now = new Date();
    try {
      const raw = window.localStorage.getItem("fintracker:incomeMonth");
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
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        window.localStorage.setItem(
          "fintracker:incomeMonth",
          JSON.stringify(next)
        );
      } catch {}
      return next;
    });
  }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dateErr, setDateErr] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    amount: "",
    category: "Работа",
    source: "Зарплата",
    date: new Date().toISOString().slice(0, 10), // ISO
  });

  const amountRef = useRef(null);

  useEffect(() => {
    setItems([]);
    setError("");
    setDateErr("");
    setOpen(false);
    setEditing(null);
    setLoading(true);
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError("");

        if (!userId) {
          if (!cancelled) {
            setItems([]);
            setLoading(false);
          }
          return;
        }

        const getMyIncomesByMonth = getMyIncomesByMonthRef.current;
        const res = await getMyIncomesByMonth(ym.year, ym.month, 0, 50);
        const data = res.data;

        if (!cancelled) {
          setItems(data?.content ?? []);
        }
      } catch (e) {
        const msg = e?.message || "Ошибка загрузки доходов";
        if (!cancelled) {
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [toast, ym.year, ym.month, userId]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      if (!userId) {
        setItems([]);
        setLoading(false);
        return;
      }
      const getMyIncomesByMonth = getMyIncomesByMonthRef.current;
      const res = await getMyIncomesByMonth(ym.year, ym.month, 0, 50);
      const data = res.data;
      setItems(data?.content ?? []);
    } catch (e) {
      const msg = e?.message || "Ошибка загрузки доходов";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [toast, ym.year, ym.month, userId]);

  const openCreate = () => {
    const iso = new Date().toISOString().slice(0, 10);
    setEditing(null);
    setDateErr("");
    setForm({
      amount: "",
      category: "Работа",
      source: "Зарплата",
      date: iso,
    });
    setOpen(true);
    setTimeout(() => {
      amountRef.current?.focus?.();
    }, 150);
  };

  const openEdit = (income) => {
    const iso = normalizeDateOnly(income?.date);
    setEditing(income);
    setDateErr("");
    setForm({
      amount: income?.amount ?? "",
      category: income?.category ?? "Работа",
      source: income?.source ?? "Зарплата",
      date: iso,
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
      setError("");

      if (dateErr) throw new Error("Неверная дата");

      const payload = {
        amount: toAmountString(form.amount),
        category: String(form.category).trim(),
        source: String(form.source).trim(),
        date: normalizeDateOnly(form.date),
      };

      const amountNum = Number(payload.amount);
      if (!Number.isFinite(amountNum) || amountNum < 0.01)
        throw new Error("Сумма должна быть больше 0");
      if (!payload.category) throw new Error("Категория обязательна");
      if (!payload.source) throw new Error("Источник обязателен");
      if (!payload.date) throw new Error("Дата обязательна");

      attempted = true;

      if (editing?.id) {
        await incomeApi.updateIncome(editing.id, payload);
        toast.success("Доход обновлён");
      } else {
        await incomeApi.createIncome(payload);
        toast.success("Доход добавлен");
      }

      setOpen(false);
      await reload();
    } catch (e) {
      const msg = e?.message || "Ошибка сохранения";

      if (isProxySerialization500(msg) && attempted) {
        setOpen(false);
        toast.success(editing?.id ? "Доход обновлён" : "Доход добавлен");
        await reload();
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
      setError("");
      await incomeApi.deleteIncome(income.id);
      toast.success("Доход удалён");
      await reload();
    } catch (e) {
      const msg = e?.message || "Ошибка удаления";
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
        ...pageBackgroundSx,
        px: { xs: 2, md: 3, lg: 4 },
        py: { xs: 2, md: 3 },
      }}
    >
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 980,
              color: bankingColors.text,
              letterSpacing: -0.3,
            }}
          >
            Доходы
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: bankingColors.muted,
              mt: 0.5,
              fontWeight: 600,
            }}
          >
            {ymLabel(ym)} · Итого: {formatAmount(total)}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Button
              variant="outlined"
              onClick={() => changeYm((s) => addMonthsYM(s, -1))}
              sx={{
                minWidth: 44,
                px: 1.2,
                borderColor: bankingColors.border,
                color: bankingColors.muted,
              }}
            >
              ←
            </Button>

            <Chip
              label={ymLabel(ym)}
              sx={{
                width: { xs: "100%", sm: "auto" },
                fontWeight: 800,
                bgcolor: bankingColors.card2,
                color: bankingColors.text,
              }}
            />

            <Button
              variant="outlined"
              onClick={() => changeYm((s) => addMonthsYM(s, +1))}
              sx={{
                minWidth: 44,
                px: 1.2,
                borderColor: bankingColors.border,
                color: bankingColors.muted,
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
              width: { xs: "100%", sm: "auto" },
              borderRadius: 999,
              px: 2.2,
              bgcolor: COLORS.income,
              color: bankingColors.bg0,
              fontWeight: 700,
              "&:hover": { bgcolor: "#16A34A" },
            }}
          >
            Добавить доход
          </Button>
        </Stack>
      </Stack>

      {/* Error */}
      {error ? (
        <Typography
          variant="body2"
          sx={{ mb: 2, color: bankingColors.danger, fontWeight: 600 }}
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
        <Box sx={{ overflowX: "auto" }}>
          <Table
            size="small"
            sx={{
              width: "100%",
              minWidth: { sm: 720 },
              tableLayout: { xs: "fixed", sm: "auto" },
              bgcolor: bankingColors.card2,
              borderRadius: 2,
              overflow: "hidden",
              border: "none",
              "& th, & td": {
                px: { xs: 0.75, sm: 2 },
                py: { xs: 0.6, sm: 1 },
                fontSize: { xs: 12, sm: 13 },
                lineHeight: 1.15,
                overflow: "hidden",
                textOverflow: "ellipsis",
                verticalAlign: "top",
                borderBottom: "none !important",
              },
              "& th": {
                fontWeight: 900,
                color: bankingColors.text,
                whiteSpace: "nowrap",
                bgcolor: bankingColors.card2,
              },
              "& td": {
                whiteSpace: { xs: "normal", sm: "nowrap" },
                color: bankingColors.text,
              },
              "& .MuiTableRow-root:hover td": {
                backgroundColor: "rgba(34, 197, 94, 0.14)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ width: { xs: "20%", sm: 140 }, whiteSpace: "nowrap" }}
                >
                  Дата
                </TableCell>
                <TableCell
                  sx={{ width: { xs: "28%", sm: 160 }, whiteSpace: "nowrap" }}
                >
                  Сумма
                </TableCell>
                <TableCell sx={{ width: { xs: "38%", sm: 200 } }}>
                  Категория
                </TableCell>
                <TableCell
                  sx={{
                    width: 200,
                    display: { xs: "none", sm: "table-cell" },
                  }}
                >
                  Источник
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    width: { xs: "14%", sm: 120 },
                    pr: { xs: 0.5, sm: 2 },
                    whiteSpace: "nowrap",
                  }}
                >
                  <Box sx={{ display: { xs: "none", sm: "block" } }}>
                    Действия
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((x) => (
                <TableRow key={x.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {isMobile
                      ? formatDateRuShort(x.date)
                      : formatDateRu(x.date)}
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 900,
                      color: bankingColors.accent,
                      whiteSpace: "nowrap",
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
                        color: bankingColors.text,
                        lineHeight: 1.15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: { xs: 2, sm: 1 },
                      }}
                      title={x.category || ""}
                    >
                      {x.category}
                    </Typography>

                    {isMobile ? (
                      <Typography
                        component="div"
                        sx={{
                          mt: 0.2,
                          fontSize: 11,
                          color: bankingColors.muted,
                          lineHeight: 1.15,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={x.source || ""}
                      >
                        {x.source}
                      </Typography>
                    ) : null}
                  </TableCell>

                  <TableCell
                    sx={{ display: { xs: "none", sm: "table-cell" } }}
                    title={x.source || ""}
                  >
                    {x.source}
                  </TableCell>

                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <IconButton onClick={() => openEdit(x)} size="small">
                      <EditOutlinedIcon
                        fontSize="small"
                        sx={{ color: bankingColors.text }}
                      />
                    </IconButton>
                    <IconButton
                      onClick={() => remove(x)}
                      size="small"
                      sx={{ color: bankingColors.danger }}
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

      {/* Dialog */}
      <Dialog
        fullScreen={fullScreen}
        scroll="paper"
        open={open}
        onClose={() => (!saving ? setOpen(false) : null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: bankingColors.card2,
            borderRadius: 2,                // чуть мягче
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)", // подчёркиваем форму
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <DialogTitle sx={{ color: bankingColors.text }}>
          {editing ? "Редактировать доход" : "Добавить доход"}
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
            maxHeight: fullScreen ? "calc(100vh - 140px)" : 520,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            bgcolor: bankingColors.card2,
          }}
        >
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            {/* Сумма */}
            <TextField
              variant="standard"
              label="Сумма"
              inputRef={amountRef}
              value={form.amount}
              onChange={(e) =>
                setForm((s) => ({ ...s, amount: e.target.value }))
              }
              placeholder="50000.00"
              inputProps={{ inputMode: "decimal" }}
              fullWidth
              InputLabelProps={{ style: { color: bankingColors.muted } }}
              InputProps={{
                disableUnderline: true,
                sx: {
                  bgcolor: "rgba(255,255,255,0.10)", // светлее
                  borderRadius: 1.8,
                  px: 1.8,
                  py: 1.4,
                  color: bankingColors.text,
                },
              }}
            />

            {/* Категория */}
            <Autocomplete
              freeSolo
              disablePortal
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(_e, newValue) =>
                setForm((s) => ({ ...s, category: newValue ?? "" }))
              }
              onInputChange={(_e, newInput) =>
                setForm((s) => ({ ...s, category: newInput }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Категория"
                  fullWidth
                  InputLabelProps={{ style: { color: bankingColors.muted } }}
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    sx: {
                      bgcolor: "rgba(255,255,255,0.10)",
                      borderRadius: 1.8,
                      px: 1.8,
                      py: 1.4,
                      color: bankingColors.text,
                    },
                  }}
                />
              )}
            />

            {/* Источник */}
            <Autocomplete
              freeSolo
              disablePortal
              options={SOURCE_OPTIONS}
              value={form.source}
              onChange={(_e, newValue) =>
                setForm((s) => ({ ...s, source: newValue ?? "" }))
              }
              onInputChange={(_e, newInput) =>
                setForm((s) => ({ ...s, source: newInput }))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Источник"
                  fullWidth
                  InputLabelProps={{ style: { color: bankingColors.muted } }}
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    sx: {
                      bgcolor: "rgba(255,255,255,0.10)",
                      borderRadius: 1.8,
                      px: 1.8,
                      py: 1.4,
                      color: bankingColors.text,
                    },
                  }}
                />
              )}
            />

            {/* Дата: один инпут и календарь вместе */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Дата"
                value={form.date ? dayjs(form.date) : null}
                onChange={(newValue) => {
                  if (!newValue) return;
                  const d = dayjs(newValue);
                  if (!d.isValid()) {
                    setDateErr("Неверная дата");
                    return;
                  }
                  const iso = d.format("YYYY-MM-DD");
                  setDateErr("");
                  setForm((s) => ({
                    ...s,
                    date: iso,
                  }));
                }}
                format="DD.MM.YYYY"
                slotProps={{
                  textField: {
                    variant: "standard",
                    fullWidth: true,
                    // ручной ввод ДД.ММ.ГГГГ
                    value: formatDateRu(form.date),
                    onChange: (e) => {
                      const ru = formatRuDateTyping(e.target.value);
                      const iso = ruToIsoStrict(ru);

                      let nextErr = "";
                      if (ru.length === 10) {
                        if (!iso) nextErr = "Неверный формат даты";
                        else if (!isValidIsoDate(iso))
                          nextErr = "Такой даты не существует";
                      }

                      setDateErr(nextErr);

                      setForm((s) => ({
                        ...s,
                        date:
                          iso && isValidIsoDate(iso) ? iso : s.date,
                      }));
                    },
                    placeholder: "16.02.2026",
                    inputProps: { inputMode: "numeric" },
                    helperText:
                      dateErr ||
                      "Можно выбрать дату в календаре или ввести ДДММГГГГ, точки добавятся сами",
                    error: Boolean(dateErr),
                    InputLabelProps: {
                      style: { color: bankingColors.muted },
                    },
                    InputProps: {
                      disableUnderline: true,
                      sx: {
                        bgcolor: "rgba(255,255,255,0.10)", // ещё светлее
                        borderRadius: 1.8,
                        px: 1.8,
                        py: 1.4,
                        color: bankingColors.text,
                      },
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.4,
            flexDirection: fullScreen ? "column" : "row",
            gap: 1.2,
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            variant="outlined"
            disabled={saving}
            fullWidth={fullScreen}
            sx={{
              borderColor: bankingColors.border,
              color: bankingColors.muted,
            }}
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
              color: bankingColors.bg0,
              "&:hover": { bgcolor: "#16A34A" },
            }}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
