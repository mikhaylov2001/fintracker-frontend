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

// ─── STYLES & TOKENS (из твоего аналога) ───
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

const surfaceSx = {
  borderRadius: 4.5, // чуть скруглим как на карточках
  border: "0",
  backgroundColor: alpha(bankingColors.card, 0.96),
  boxShadow: "0 16px 44px rgba(0,0,0,0.48)",
};

// Стилизация инпутов под темную тему
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

// ─── OPTIONS & HELPERS ───
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

// ─── COMPONENT ───
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

  // State
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
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
          sx={{ mb: 3 }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
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
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                bgcolor: alpha(bankingColors.card, 0.5),
                p: 0.5,
                borderRadius: 99,
                border: `1px solid ${bankingColors.border}`,
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
              }}
            >
              <IconButton
                onClick={() => changeYm((s) => addMonthsYM(s, -1))}
                size="small"
                sx={{ color: bankingColors.text, "&:hover": { bgcolor: alpha("#fff", 0.1) } }}
              >
                ←
              </IconButton>
              <Typography
                sx={{
                  color: bankingColors.text,
                  fontWeight: 800,
                  fontSize: 14,
                  px: 1,
                }}
              >
                {ymLabel(ym)}
              </Typography>
              <IconButton
                onClick={() => changeYm((s) => addMonthsYM(s, +1))}
                size="small"
                sx={{ color: bankingColors.text, "&:hover": { bgcolor: alpha("#fff", 0.1) } }}
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
                py: 1,
                fontWeight: 800,
                textTransform: "none",
                bgcolor: bankingColors.primary,
                "&:hover": { bgcolor: bankingColors.accent },
                boxShadow: `0 8px 20px ${alpha(bankingColors.primary, 0.4)}`,
              }}
            >
              Добавить
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

        {/* Card with Table */}
        {!loading && items.length === 0 ? (
          <Box
            sx={{
              ...surfaceSx,
              p: 4,
              textAlign: "center",
              color: bankingColors.muted,
            }}
          >
            <EmptyState
              title="Пока нет записей"
              description="Добавь первую операцию — и тут появится список."
              actionLabel="Добавить доход"
              onAction={openCreate}
            />
          </Box>
        ) : (
          <Box sx={{ ...surfaceSx, overflow: "hidden" }}>
            <Box sx={{ overflowX: "auto" }}>
              <Table
                sx={{
                  width: "100%",
                  minWidth: { sm: 720 },
                  "& th": {
                    fontWeight: 800,
                    color: bankingColors.muted,
                    whiteSpace: "nowrap",
                    borderBottom: `1px solid ${alpha(bankingColors.border, 0.5)}`,
                    bgcolor: alpha("#000", 0.2),
                    py: 2,
                    px: 2,
                  },
                  "& td": {
                    color: bankingColors.text,
                    borderBottom: `1px solid ${alpha(bankingColors.border, 0.15)}`,
                    py: 1.5,
                    px: 2,
                    fontSize: 14,
                    fontWeight: 600,
                  },
                  "& .MuiTableRow-root:last-of-type td": { borderBottom: 0 },
                  "& .MuiTableRow-root:hover": {
                    bgcolor: alpha(bankingColors.primary, 0.05),
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Сумма</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                      Источник
                    </TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((x) => (
                    <TableRow key={x.id}>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {isMobile
                          ? formatDateRuShort(x.date)
                          : formatDateRu(x.date)}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 900,
                          color: bankingColors.primary,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatAmount(Number(x.amount || 0))}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            component="span"
                            sx={{ fontWeight: 700, fontSize: 14 }}
                          >
                            {x.category}
                          </Typography>
                          {isMobile && x.source && (
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ color: bankingColors.muted }}
                            >
                              {x.source}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ display: { xs: "none", sm: "table-cell" } }}
                      >
                        {x.source}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <IconButton
                          onClick={() => openEdit(x)}
                          size="small"
                          sx={{ color: bankingColors.muted, "&:hover": { color: "#fff" } }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => remove(x)}
                          size="small"
                          sx={{ color: alpha(bankingColors.danger, 0.7), "&:hover": { color: bankingColors.danger } }}
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
              ...surfaceSx,
              backgroundImage: "none",
              border: `1px solid ${alpha(bankingColors.border, 0.3)}`,
            },
          }}
        >
          <DialogTitle sx={{ fontWeight: 900, color: bankingColors.text }}>
            {editing ? "Редактировать доход" : "Новый доход"}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.5} sx={{ mt: 1 }}>
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
                onChange={(_e, val) => setForm((s) => ({ ...s, category: val ?? "" }))}
                onInputChange={(_e, val) => setForm((s) => ({ ...s, category: val }))}
                renderInput={(params) => (
                  <TextField {...params} label="Категория" sx={darkInputSx} />
                )}
                PaperComponent={(props) => (
                  <Box
                    {...props}
                    sx={{
                      bgcolor: bankingColors.card2,
                      color: bankingColors.text,
                      "& .MuiAutocomplete-option": {
                         "&:hover": { bgcolor: alpha(bankingColors.primary, 0.15) },
                         "&[aria-selected='true']": { bgcolor: alpha(bankingColors.primary, 0.25) }
                      }
                    }}
                  />
                )}
              />

              <Autocomplete
                freeSolo
                options={SOURCE_OPTIONS}
                value={form.source}
                onChange={(_e, val) => setForm((s) => ({ ...s, source: val ?? "" }))}
                onInputChange={(_e, val) => setForm((s) => ({ ...s, source: val }))}
                renderInput={(params) => (
                  <TextField {...params} label="Источник" sx={darkInputSx} />
                )}
                PaperComponent={(props) => (
                  <Box
                    {...props}
                    sx={{
                      bgcolor: bankingColors.card2,
                      color: bankingColors.text,
                      "& .MuiAutocomplete-option": {
                         "&:hover": { bgcolor: alpha(bankingColors.primary, 0.15) },
                         "&[aria-selected='true']": { bgcolor: alpha(bankingColors.primary, 0.25) }
                      }
                    }}
                  />
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
                    if (!iso) nextErr = "Неверный формат";
                    else if (!isValidIsoDate(iso)) nextErr = "Нет такой даты";
                  }
                  setDateErr(nextErr);
                  setForm((s) => ({
                    ...s,
                    dateRu: ru,
                    date: iso && isValidIsoDate(iso) ? iso : s.date,
                  }));
                }}
                placeholder="ДД.ММ.ГГГГ"
                inputProps={{ inputMode: "numeric" }}
                fullWidth
                error={Boolean(dateErr)}
                helperText={dateErr}
                sx={darkInputSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarMonthIcon sx={{ color: bankingColors.muted }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
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
                fontWeight: 800,
                borderRadius: 99,
                px: 3,
                "&:hover": { bgcolor: bankingColors.accent },
              }}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}
