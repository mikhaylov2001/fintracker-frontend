// src/pages/Expenses/ExpensesPage.jsx
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
  Popover,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import Autocomplete from "@mui/material/Autocomplete";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import dayjs from "dayjs";
import "dayjs/locale/ru";

import EmptyState from "../../components/EmptyState";
import { useToast } from "../../contexts/ToastContext";

import { useExpensesApi } from "../../api/expensesApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";

import { bankingColors } from "../../styles/bankingTokens";

const COLORS = { expenses: "#F97316" };

const CATEGORY_OPTIONS = [
  "Продукты",
  "Транспорт",
  "Коммунальные услуги",
  "Здоровье",
  "Развлечения",
  "Другое",
];

const PILL_INPUT_SX = {
  bgcolor: "rgba(255,255,255,0.10)",
  borderRadius: 999,
  px: 2,
  height: 56,
  display: "flex",
  alignItems: "center",
  color: bankingColors.text,
  "& input": {
    padding: 0,
    height: "100%",
    boxSizing: "border-box",
  },
};

const toAmountString = (v) => String(v ?? "").trim().replace(",", ".");

const normalizeDateOnly = (d) => {
  if (!d) return "";
  const s = String(d);
  if (s.includes("T")) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
};

const formatDateRu = (dateLike) => {
  const s = normalizeDateOnly(dateLike);
  const [y, m, d] = String(s || "").split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
};

const formatDateRuShort = (dateLike) => {
  const s = normalizeDateOnly(dateLike);
  const [y, m, d] = String(s || "").split("-");
  if (!y || !m || !d) return "";
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
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
};

const isProxySerialization500 = (msg) => String(msg || "").includes("ByteBuddyInterceptor");

const addMonthsYM = ({ year, month }, delta) => {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

const ymLabel = ({ year, month }) => `${String(month).padStart(2, "0")}.${year}`;

const getExpenseDateLike = (x) =>
  x?.date ?? x?.operationDate ?? x?.expenseDate ?? x?.createdAt ?? x?.created_at ?? x?.timestamp ?? "";

export default function ExpensesPage() {
  const toast = useToast();
  const theme = useTheme();
  const { formatAmount } = useCurrency();
  const { user } = useAuth();
  const userId = user?.id;

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const expensesApi = useExpensesApi();
  const getMyExpensesByMonthRef = useRef(expensesApi.getMyExpensesByMonth);

  const [ym, setYm] = useState(() => {
    const now = new Date();
    try {
      const raw = window.localStorage.getItem("fintracker:expenseMonth");
      if (!raw) return { year: now.getFullYear(), month: now.getMonth() + 1 };
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
        window.localStorage.setItem("fintracker:expenseMonth", JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [dateErr, setDateErr] = useState("");
  const [dateInput, setDateInput] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    category: "Продукты",
    description: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const [calAnchorEl, setCalAnchorEl] = useState(null);
  const calOpen = Boolean(calAnchorEl);
  const openCalendar = (e) => setCalAnchorEl(e.currentTarget);
  const closeCalendar = () => setCalAnchorEl(null);

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

        const getMyExpensesByMonth = getMyExpensesByMonthRef.current;
        const res = await getMyExpensesByMonth(ym.year, ym.month, 0, 50);
        const data = res.data;

        if (!cancelled) setItems(data?.content ?? []);
      } catch (e) {
        const msg = e?.message || "Ошибка загрузки расходов";
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
      const getMyExpensesByMonth = getMyExpensesByMonthRef.current;
      const res = await getMyExpensesByMonth(ym.year, ym.month, 0, 50);
      const data = res.data;
      setItems(data?.content ?? []);
    } catch (e) {
      const msg = e?.message || "Ошибка загрузки расходов";
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
      category: "Продукты",
      description: "",
      date: iso,
    });
    setDateInput(formatDateRu(iso));
    setOpen(true);
    setTimeout(() => amountRef.current?.focus?.(), 150);
  };

  const openEdit = (expense) => {
    const iso = normalizeDateOnly(getExpenseDateLike(expense)) || new Date().toISOString().slice(0, 10);

    setEditing(expense);
    setDateErr("");
    setForm({
      amount: expense?.amount ?? "",
      category: expense?.category ?? "Продукты",
      description: expense?.description ?? "",
      date: iso,
    });
    setDateInput(formatDateRu(iso));
    setOpen(true);
    setTimeout(() => amountRef.current?.focus?.(), 150);
  };

  const save = async () => {
    let attempted = false;

    try {
      setSaving(true);
      setError("");

      if (dateErr) throw new Error("Неверная дата");
      if (!form.date || !isValidIsoDate(form.date)) throw new Error("Введите корректную дату");

      const payload = {
        amount: toAmountString(form.amount),
        category: String(form.category).trim(),
        description: String(form.description).trim(),
        date: normalizeDateOnly(form.date),
      };

      const amountNum = Number(payload.amount);
      if (!Number.isFinite(amountNum) || amountNum < 0.01) throw new Error("Сумма должна быть больше 0");
      if (!payload.category) throw new Error("Категория обязательна");

      attempted = true;

      if (editing?.id) {
        await expensesApi.updateExpense(editing.id, payload);
        toast.success("Расход обновлён");
      } else {
        await expensesApi.createExpense(payload);
        toast.success("Расход добавлен");
      }

      setOpen(false);
      await reload();
    } catch (e) {
      const msg = e?.message || "Ошибка сохранения";

      if (isProxySerialization500(msg) && attempted) {
        setOpen(false);
        toast.success(editing?.id ? "Расход обновлён" : "Расход добавлен");
        await reload();
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
      setError("");
      await expensesApi.deleteExpense(expense.id);
      toast.success("Расход удалён");
      await reload();
    } catch (e) {
      const msg = e?.message || "Ошибка удаления";
      setError(msg);
      toast.error(msg);
    }
  };

  const total = useMemo(() => items.reduce((acc, x) => acc + Number(x.amount || 0), 0), [items]);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3, lg: 4 },
        py: { xs: 2, md: 3 },
        width: "100%",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
      }}
    >
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
            Расходы
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

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="outlined"
              onClick={() => changeYm((s) => addMonthsYM(s, -1))}
              sx={{
                minWidth: 44,
                px: 1.2,
                borderColor: bankingColors.border,
                color: bankingColors.muted,
                userSelect: "none",
                WebkitUserSelect: "none",
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
                userSelect: "none",
                WebkitUserSelect: "none",
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
                userSelect: "none",
                WebkitUserSelect: "none",
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
              bgcolor: COLORS.expenses,
              color: bankingColors.bg0,
              fontWeight: 700,
              "&:hover": { bgcolor: "#EA580C" },
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
          >
            Добавить расход
          </Button>
        </Stack>
      </Stack>

      {error ? (
        <Typography variant="body2" sx={{ mb: 2, color: bankingColors.danger, fontWeight: 600 }}>
          {error}
        </Typography>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title="Пока нет записей"
          description="Добавь первую операцию — и тут появится список за выбранный месяц."
          actionLabel="Добавить"
          onAction={openCreate}
        />
      ) : (
        <Box sx={{ overflowX: "hidden" }}>
          <Table
            size="small"
            sx={{
              width: "100%",
              minWidth: { xs: "100%", sm: 720 },
              tableLayout: { xs: "auto", sm: "auto" },
              bgcolor: "transparent",
              borderRadius: 0,
              overflow: "visible",
              border: "none",
              "& th, & td": {
                px: { xs: 1, sm: 2 },
                py: { xs: 0.9, sm: 1.1 },
                fontSize: { xs: 12, sm: 13 },
                lineHeight: 1.3,
                borderBottom: "none !important",
                whiteSpace: { xs: "normal", sm: "nowrap" },
                verticalAlign: "middle",
              },
              "& th": {
                fontWeight: 900,
                color: bankingColors.text,
                bgcolor: "transparent",
                textAlign: "left",
              },
              "& td": {
                color: bankingColors.text,
              },
              "& .MuiTableRow-root:hover td": {
                backgroundColor: "rgba(249, 115, 22, 0.14)",
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: "25%", sm: 140 } }}>Дата</TableCell>
                <TableCell
                  sx={{
                    width: { xs: "30%", sm: 160 },
                    textAlign: { xs: "center", sm: "left" },
                  }}
                >
                  Сумма
                </TableCell>
                <TableCell sx={{ width: { xs: "30%", sm: 200 } }}>Категория</TableCell>
                <TableCell
                  sx={{
                    width: 200,
                    display: { xs: "none", sm: "table-cell" },
                  }}
                >
                  Описание
                </TableCell>
                <TableCell
                  sx={{
                    width: { xs: "15%", sm: 120 },
                    textAlign: "center",
                  }}
                >
                  Действия
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.map((x) => {
                const dateLike = getExpenseDateLike(x);
                return (
                  <TableRow key={x.id} hover>
                    <TableCell>
                      {isMobile ? formatDateRuShort(dateLike) : formatDateRu(dateLike)}
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 900,
                        color: COLORS.expenses,
                        textAlign: { xs: "center", sm: "left" },
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
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={x.description || ""}
                        >
                          {x.description}
                        </Typography>
                      ) : null}
                    </TableCell>

                    <TableCell
                      sx={{ display: { xs: "none", sm: "table-cell" } }}
                      title={x.description || ""}
                    >
                      {x.description}
                    </TableCell>

                    <TableCell sx={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      <IconButton
                        onClick={() => openEdit(x)}
                        size="small"
                        sx={{ userSelect: "none" }}
                      >
                        <EditOutlinedIcon fontSize="small" sx={{ color: bankingColors.text }} />
                      </IconButton>
                      <IconButton
                        onClick={() => remove(x)}
                        size="small"
                        sx={{ color: bankingColors.danger, userSelect: "none" }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog
        fullScreen={fullScreen}
        scroll="paper"
        open={open}
        onClose={() => (!saving ? setOpen(false) : null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            backgroundColor: "#111827",
            borderRadius: 2,
            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      >
        <DialogTitle sx={{ color: bankingColors.text, userSelect: "none", WebkitUserSelect: "none" }}>
          {editing ? "Редактировать расход" : "Добавить расход"}
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
            maxHeight: fullScreen ? "calc(100vh - 140px)" : 520,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            bgcolor: "#111827",
          }}
        >
          <Stack spacing={2.2} sx={{ mt: 1 }}>
            <TextField
              variant="standard"
              label="Сумма"
              inputRef={amountRef}
              value={form.amount}
              onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
              placeholder="1500.00"
              inputProps={{ inputMode: "decimal" }}
              fullWidth
              InputLabelProps={{ style: { color: bankingColors.muted }, shrink: true }}
              InputProps={{ disableUnderline: true, sx: PILL_INPUT_SX }}
            />

            <Autocomplete
              freeSolo
              disablePortal
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(_e, newValue) => setForm((s) => ({ ...s, category: newValue ?? "" }))}
              onInputChange={(_e, newInput) => setForm((s) => ({ ...s, category: newInput }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Категория"
                  fullWidth
                  InputLabelProps={{ style: { color: bankingColors.muted }, shrink: true }}
                  InputProps={{
                    ...params.InputProps,
                    disableUnderline: true,
                    sx: PILL_INPUT_SX,
                  }}
                />
              )}
            />

            <TextField
              variant="standard"
              label="Описание"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              fullWidth
              InputLabelProps={{ style: { color: bankingColors.muted }, shrink: true }}
              InputProps={{ disableUnderline: true, sx: PILL_INPUT_SX }}
            />

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
              <TextField
                variant="standard"
                label="Дата"
                fullWidth
                value={dateInput}
                onChange={(e) => {
                  const ru = formatRuDateTyping(e.target.value);
                  setDateInput(ru);

                  if (!ru) {
                    setDateErr("");
                    setForm((s) => ({ ...s, date: "" }));
                    return;
                  }

                  const iso = ruToIsoStrict(ru);

                  let nextErr = "";
                  if (ru.length === 10) {
                    if (!iso) nextErr = "Неверный формат даты";
                    else if (!isValidIsoDate(iso)) nextErr = "Такой даты не существует";
                  }
                  setDateErr(nextErr);

                  if (ru.length === 10 && iso && isValidIsoDate(iso)) {
                    setForm((s) => ({ ...s, date: iso }));
                  }
                }}
                placeholder="20.02.2026"
                inputProps={{ inputMode: "numeric" }}
                helperText={
                  dateErr ||
                  "Введите вручную 8 цифр (например: 20022026 → 20.02.2026) или нажмите на значок календаря справа"
                }
                error={Boolean(dateErr)}
                InputLabelProps={{ style: { color: bankingColors.muted }, shrink: true }}
                InputProps={{
                  disableUnderline: true,
                  sx: PILL_INPUT_SX,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          openCalendar(e);
                        }}
                        size="small"
                        sx={{ color: bankingColors.muted, userSelect: "none" }}
                        aria-label="Открыть календарь"
                      >
                        <CalendarMonthOutlinedIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                FormHelperTextProps={{
                  sx: {
                    color: dateErr ? bankingColors.danger : bankingColors.muted,
                    fontSize: "0.75rem",
                    mt: 0.5,
                    mx: 0,
                  },
                }}
              />

              <Popover
                open={calOpen}
                anchorEl={calAnchorEl}
                onClose={closeCalendar}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    bgcolor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.12)",
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <Box sx={{ p: 1 }}>
                  <DateCalendar
                    value={form.date ? dayjs(form.date) : dayjs()}
                    onChange={(newValue) => {
                      if (!newValue) return;
                      const d = dayjs(newValue);
                      if (!d.isValid()) return;
                      const iso = d.format("YYYY-MM-DD");
                      setForm((s) => ({ ...s, date: iso }));
                      setDateInput(formatDateRu(iso));
                      setDateErr("");
                      closeCalendar();
                    }}
                    sx={{
                      bgcolor: "#FFFFFF",
                      color: "#1F2937",
                      "& .MuiPickersCalendarHeader-root": {
                        color: "#1F2937",
                        bgcolor: "#FFFFFF",
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        color: "#1F2937",
                        fontWeight: 700,
                      },
                      "& .MuiIconButton-root": {
                        color: "#1F2937",
                      },
                      "& .MuiDayCalendar-weekDayLabel": {
                        color: "#6B7280",
                        fontWeight: 600,
                      },
                      "& .MuiPickersDay-root": {
                        color: "#1F2937",
                        bgcolor: "transparent",
                        "&:hover": {
                          bgcolor: "rgba(249, 115, 22, 0.1)",
                        },
                      },
                      "& .MuiPickersDay-root.Mui-selected": {
                        bgcolor: COLORS.expenses,
                        color: "#FFFFFF",
                        fontWeight: 700,
                        "&:hover": {
                          bgcolor: "#EA580C",
                        },
                      },
                      "& .MuiPickersDay-today": {
                        border: `2px solid ${COLORS.expenses} !important`,
                        bgcolor: "transparent",
                      },
                      "& .MuiPickersDay-root.Mui-disabled": {
                        color: "#D1D5DB",
                      },
                    }}
                  />
                </Box>
              </Popover>
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
            sx={{ borderColor: bankingColors.border, color: bankingColors.muted, userSelect: "none" }}
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
              color: bankingColors.bg0,
              "&:hover": { bgcolor: "#EA580C" },
              userSelect: "none",
            }}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
