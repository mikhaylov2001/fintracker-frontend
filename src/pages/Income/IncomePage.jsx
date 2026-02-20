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
  InputAdornment,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Autocomplete from "@mui/material/Autocomplete";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import EmptyState from "../../components/EmptyState";
import { useToast } from "../../contexts/ToastContext";
import { useIncomeApi } from "../../api/incomeApi";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useAuth } from "../../contexts/AuthContext";

// ─── Токены как в дашборде ───
const bankingColors = {
  bg0: "#021513",
  bg1: "#031C18",

  card: "#04231E",
  card2: "#03201B",

  border: "rgba(125, 244, 194, 0.24)",
  border2: "rgba(167, 243, 208, 0.32)",

  text: "rgba(241,245,249,0.97)",
  muted: "rgba(241,245,249,0.72)",

  primary: "#22C55E",
  accent: "#34D399",
  info: "#38BDF8",
  warning: "#FBBF24",
  danger: "#FB7185",
  success: "#22C55E",
};

const pageBackgroundSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  bgcolor: bankingColors.bg0,
  backgroundImage: `
    radial-gradient(900px 520px at 14% 8%,  ${alpha("#00BC7D", 0.26)} 0%, transparent 60%),
    radial-gradient(900px 520px at 82% 12%, ${alpha("#009966", 0.20)} 0%, transparent 62%),
    radial-gradient(900px 520px at 50% 92%, ${alpha("#22C55E", 0.16)} 0%, transparent 62%),
    linear-gradient(180deg, ${bankingColors.bg1} 0%, ${bankingColors.bg0} 100%)
  `,
  userSelect: "none",
};

const gridOverlaySx = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.05,
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.20) 1px, transparent 1px)," +
    "linear-gradient(to bottom, rgba(255,255,255,0.20) 1px, transparent 1px)",
  backgroundSize: "84px 84px",
  mixBlendMode: "soft-light",
};

// Белая карточка под список (без рамки, мягкая тень)
const listCardSx = {
  borderRadius: 4,
  bgcolor: "#FFFFFF",
  boxShadow: "0 14px 40px rgba(15,23,42,0.45)",
};

// Инпуты в диалоге под тёмный фон
const darkInputSx = {
  "& .MuiInputLabel-root": { color: bankingColors.muted },
  "& .MuiInputLabel-root.Mui-focused": { color: bankingColors.primary },
  "& .MuiOutlinedInput-root": {
    color: bankingColors.text,
    "& fieldset": { borderColor: alpha(bankingColors.border, 0.5) },
    "&:hover fieldset": { borderColor: alpha(bankingColors.border, 0.8) },
    "&.Mui-focused fieldset": { borderColor: bankingColors.primary },
  },
  "& .MuiInputAdornment-root": { color: bankingColors.muted },
  "& .MuiSvgIcon-root": { color: bankingColors.muted },
};

// ─── Константы и хелперы ───
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

// ─── Компонент ───
export default function IncomePage() {
  const toast = useToast();
  const theme = useTheme();
  const { formatAmount } = useCurrency();
  const { user } = useAuth();
  const userId = user?.id;

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
    date: new Date().toISOString().slice(0, 10),
    dateRu: "",
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
    setDateErr("");
    setForm({
      amount: income?.amount ?? "",
      category: income?.category ?? "Работа",
      source: income?.source ?? "Зарплата",
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
      setError("");
      if (dateErr) throw new Error(dateErr);

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
    <Box sx={pageBackgroundSx}>
      <Box sx={gridOverlaySx} />

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2, md: 3, lg: 4 },
          py: { xs: 2, md: 3 },
          width: "100%",
          maxWidth: { xs: "100%", md: 1120 },
          mx: "auto",
        }}
      >
        {/* Header на чистом фоне */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: 3 }}
        >
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 950,
                color: bankingColors.text,
                letterSpacing: -0.5,
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
            spacing={1.25}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                px: 1,
                py: 0.75,
                borderRadius: 999,
                border: `1px solid ${bankingColors.border}`,
                bgcolor: "transparent",
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
              }}
            >
              <IconButton
                onClick={() => changeYm((s) => addMonthsYM(s, -1))}
                size="small"
                sx={{
                  color: bankingColors.text,
                  "&:hover": { bgcolor: alpha("#fff", 0.08) },
                }}
              >
                ←
              </IconButton>
              <Typography
                sx={{
                  color: bankingColors.text,
                  fontWeight: 800,
                  fontSize: 14,
                  px: 1,
                  minWidth: 80,
                  textAlign: "center",
                }}
              >
                {ymLabel(ym)}
              </Typography>
              <IconButton
                onClick={() => changeYm((s) => addMonthsYM(s, +1))}
                size="small"
                sx={{
                  color: bankingColors.text,
                  "&:hover": { bgcolor: alpha("#fff", 0.08) },
                }}
              >
                →
              </IconButton>
            </Stack>

            <Button
              onClick={openCreate}
              variant="contained"
              fullWidth
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: 999,
                px: 3,
                py: 1.05,
                fontWeight: 850,
                textTransform: "none",
                bgcolor: bankingColors.primary,
                "&:hover": { bgcolor: bankingColors.accent },
                boxShadow: `0 10px 30px ${alpha(bankingColors.primary, 0.45)}`,
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

        {/* Список */}
        {!loading && items.length === 0 ? (
          <Box
            sx={{
              ...listCardSx,
              px: { xs: 2, sm: 3 },
              py: { xs: 3, sm: 4 },
              textAlign: "center",
            }}
          >
            <EmptyState
              title="Пока нет записей"
              description="Добавь первую операцию — и здесь появится список за выбранный месяц."
              actionLabel="Добавить доход"
              onAction={openCreate}
            />
          </Box>
        ) : (
          <Box
            sx={{
              ...listCardSx,
              width: "100%",
              mt: 1,
            }}
          >
            <Box sx={{ overflowX: "auto" }}>
              <Table
                size="small"
                sx={{
                  width: "100%",
                  minWidth: { xs: 640, md: 900 },
                  tableLayout: { xs: "fixed", md: "auto" },
                  "& th, & td": {
                    px: { xs: 1.25, sm: 2.25 },
                    py: { xs: 1, sm: 1.25 },
                    fontSize: { xs: 12, sm: 13 },
                    lineHeight: 1.2,
                    borderBottomColor: "#E2E8F0",
                  },
                  "& th": {
                    fontWeight: 900,
                    color: "#0F172A",
                    whiteSpace: "nowrap",
                    bgcolor: "#F8FAFC",
                  },
                  "& td": {
                    color: "#0F172A",
                    whiteSpace: { xs: "normal", sm: "nowrap" },
                  },
                  "& .MuiTableRow-root:last-of-type td": { borderBottom: 0 },
                  "& .MuiTableRow-root:hover": {
                    bgcolor: "rgba(15,23,42,0.03)",
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: { xs: "18%", sm: 120 } }}>
                      Дата
                    </TableCell>
                    <TableCell sx={{ width: { xs: "26%", sm: 150 } }}>
                      Сумма
                    </TableCell>
                    <TableCell sx={{ width: { xs: "36%", sm: 220 } }}>
                      Категория
                    </TableCell>
                    <TableCell
                      sx={{
                        width: 220,
                        display: { xs: "none", sm: "table-cell" },
                      }}
                    >
                      Источник
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        width: { xs: "20%", sm: 120 },
                        pr: { xs: 1.5, sm: 2.25 },
                        whiteSpace: "nowrap",
                      }}
                    >
                      Действия
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
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatAmount(Number(x.amount || 0))}
                      </TableCell>

                      <TableCell sx={{ pr: { xs: 1.5, sm: 2.25 } }}>
                        <Typography
                          component="div"
                          sx={{
                            fontSize: { xs: 12, sm: 13 },
                            fontWeight: 800,
                            color: "#0F172A",
                            lineHeight: 1.2,
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
                              color: "#64748B",
                              lineHeight: 1.2,
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
                        <IconButton
                          onClick={() => openEdit(x)}
                          size="small"
                          sx={{
                            color: "#64748B",
                            "&:hover": { color: "#0F172A" },
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => remove(x)}
                          size="small"
                          sx={{
                            color: "#EF4444",
                            "&:hover": { color: "#B91C1C" },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Dialog */}
        <Dialog
          open={open}
          onClose={() => (!saving ? setOpen(false) : null)}
          fullWidth
          maxWidth="sm"
          PaperProps={{
            sx: {
              borderRadius: 3,
              bgcolor: bankingColors.card,
              boxShadow: "0 22px 60px rgba(0,0,0,0.7)",
              border: `1px solid ${alpha(bankingColors.border, 0.3)}`,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, color: bankingColors.text }}>
            {editing ? "Редактировать доход" : "Добавить доход"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.4} sx={{ mt: 1 }}>
              <TextField
                label="Сумма"
                inputRef={amountRef}
                value={form.amount}
                onChange={(e) =>
                  setForm((s) => ({ ...s, amount: e.target.value }))
                }
                placeholder="0.00"
                inputProps={{ inputMode: "decimal" }}
                fullWidth
                sx={darkInputSx}
              />

              <Autocomplete
                freeSolo
                options={CATEGORY_OPTIONS}
                value={form.category}
                onChange={(_e, val) =>
                  setForm((s) => ({ ...s, category: val ?? "" }))
                }
                onInputChange={(_e, val) =>
                  setForm((s) => ({ ...s, category: val }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Категория" sx={darkInputSx} />
                )}
              />

              <Autocomplete
                freeSolo
                options={SOURCE_OPTIONS}
                value={form.source}
                onChange={(_e, val) =>
                  setForm((s) => ({ ...s, source: val ?? "" }))
                }
                onInputChange={(_e, val) =>
                  setForm((s) => ({ ...s, source: val }))
                }
                renderInput={(params) => (
                  <TextField {...params} label="Источник" sx={darkInputSx} />
                )}
              />

              <TextField
                label="Дата"
                value={form.dateRu || ""}
                onChange={(e) => {
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
                    dateRu: ru,
                    date: iso && isValidIsoDate(iso) ? iso : s.date,
                  }));
                }}
                placeholder="16.02.2026"
                inputProps={{ inputMode: "numeric" }}
                fullWidth
                error={Boolean(dateErr)}
                helperText={dateErr || "Введите цифры: ДДММГГГГ"}
                sx={darkInputSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarMonthIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
            <Button
              onClick={() => setOpen(false)}
              disabled={saving}
              sx={{ color: bankingColors.muted, fontWeight: 700 }}
            >
              Отмена
            </Button>
            <Button
              onClick={save}
              variant="contained"
              disabled={saving}
              sx={{
                bgcolor: bankingColors.primary,
                color: "#fff",
                fontWeight: 850,
                borderRadius: 999,
                px: 3,
                "&:hover": { bgcolor: bankingColors.accent },
              }}
            >
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
