import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { formatDateRu, todayISO } from "../../lib/ftUtils";
import {
  avgPerDayInPeriod,
  calendarDaysInPeriod,
  periodDescription,
} from "../../lib/periodUtils";
import FtDatePicker from "./FtDatePicker";
import PeriodSelector from "./PeriodSelector";
import KpiStat from "./KpiStat";

export default function TransactionsPage({
  title,
  subtitle,
  kind,
  items,
  loading,
  categories,
  categoriesLoading,
  onAddCategory,
  sources,
  accent,
  formatAmount,
  onSave,
  onDelete,
  period,
  onPeriodChange,
  periodHint,
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, t) => s + t.amount, 0);
  const opCount = items.length;
  const avgOp = opCount ? Math.round(total / opCount) : 0;
  const calDays = period ? calendarDaysInPeriod(period) : 1;
  const avgDay = period ? avgPerDayInPeriod(total, items, period) : 0;
  const periodLabel = period ? periodDescription(period) : "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
    if (!q) return sorted;
    return sorted.filter(
      (t) =>
        t.category.toLowerCase().includes(q) ||
        (t.source ?? "").toLowerCase().includes(q) ||
        (t.comment ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  const palette =
    accent === "emerald"
      ? { btn: "bg-emerald-glow", text: "text-emerald-glow", glow: "bg-emerald-glow/10" }
      : { btn: "bg-warning", text: "text-warning", glow: "bg-warning/10" };

  const handleSave = async (tx) => {
    try {
      setSaving(true);
      await onSave(tx, editing);
      setOpen(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить операцию?")) return;
    await onDelete(id);
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">Загрузка…</p>
    );
  }

  return (
    <>
      <header className="flex flex-col gap-4 mb-6 sm:mb-8 lg:flex-row lg:justify-between lg:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-col w-full min-w-0 gap-3 lg:w-auto lg:flex-row lg:items-end lg:shrink-0">
          {period && onPeriodChange && (
            <PeriodSelector period={period} onChange={onPeriodChange} variant="header" />
          )}
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[2.75rem] rounded-xl font-semibold text-sm transition-all shrink-0 w-full lg:w-auto ${palette.btn} text-primary-foreground shadow-[0_0_24px_oklch(0.72_0.18_162/0.25)] hover:brightness-110`}
          >
            <Plus className="size-4" />
            Добавить
          </button>
        </div>
      </header>

      {periodLabel && (
        <p className="text-xs text-muted-foreground mb-3 -mt-2">
          Показатели за период: <span className="text-foreground/90">{periodLabel}</span>
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KpiStat
          label="Всего"
          value={formatAmount(total)}
          highlight
        />
        <KpiStat label="Операций" value={String(opCount)} />
        <KpiStat
          label="В среднем за день"
          value={formatAmount(avgDay)}
          hint={calDays > 0 ? `за ${calDays} календ. дн.` : undefined}
        />
        <KpiStat
          label="Средняя операция"
          value={formatAmount(avgOp)}
          hint={opCount > 0 ? `на ${opCount} оп.` : undefined}
        />
      </div>

      <div className="relative mb-5">
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по категории, источнику, комментарию"
          className="w-full bg-surface border border-border rounded-xl pl-11 pr-4 h-11 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-emerald-glow/40 transition"
        />
      </div>

      <section className="bg-surface rounded-3xl border border-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] text-foreground text-xs font-semibold hover:bg-white/[0.08] transition"
            >
              <Plus className="size-3.5" /> Добавить первую операцию
            </button>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground border-b border-border">
                    <th className="text-left font-semibold px-6 py-4">Дата</th>
                    <th className="text-left font-semibold px-6 py-4">Категория</th>
                    {sources && <th className="text-left font-semibold px-6 py-4">Источник</th>}
                    <th className="text-left font-semibold px-6 py-4">Комментарий</th>
                    <th className="text-right font-semibold px-6 py-4">Сумма</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-white/[0.02] transition">
                      <td className="px-6 py-3.5 text-muted-foreground tabular-nums">{formatDateRu(t.date)}</td>
                      <td className="px-6 py-3.5 font-medium">{t.category}</td>
                      {sources && <td className="px-6 py-3.5 text-muted-foreground">{t.source || "—"}</td>}
                      <td className="px-6 py-3.5 text-muted-foreground max-w-[200px] truncate">{t.comment || "—"}</td>
                      <td className={`px-6 py-3.5 text-right font-semibold tabular-nums ${palette.text}`}>
                        {kind === "income" ? "+" : "−"}
                        {formatAmount(t.amount)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(t);
                              setOpen(true);
                            }}
                            className="ft-touch grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition"
                            aria-label="Редактировать"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="ft-touch grid place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                            aria-label="Удалить"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="lg:hidden divide-y divide-border">
              {filtered.map((t) => (
                <li key={t.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{t.category}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateRu(t.date)}
                      {t.source ? ` · ${t.source}` : ""}
                    </p>
                    {t.comment && <p className="text-xs text-muted-foreground mt-1 truncate">{t.comment}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-sm font-semibold tabular-nums ${palette.text}`}>
                      {kind === "income" ? "+" : "−"}
                      {formatAmount(t.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(t);
                          setOpen(true);
                        }}
                        className="ft-touch grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground"
                        aria-label="Редактировать"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="ft-touch grid place-items-center rounded-lg hover:bg-destructive/10 text-destructive"
                        aria-label="Удалить"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {open && (
        <TxDialog
          initial={editing}
          kind={kind}
          categories={categories}
          categoriesLoading={categoriesLoading}
          onAddCategory={onAddCategory}
          sources={sources}
          saving={saving}
          onSave={handleSave}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function TxDialog({
  initial,
  kind,
  categories,
  categoriesLoading,
  onAddCategory,
  sources,
  saving,
  onSave,
  onClose,
}) {
  const CUSTOM_VALUE = "__custom__";
  const baseCategories = useMemo(() => {
    const set = new Set(categories || []);
    if (initial?.category) set.add(initial.category);
    return [...set].sort((a, b) => a.localeCompare(b, "ru"));
  }, [categories, initial?.category]);

  const initialIsCustom =
    initial?.category && !baseCategories.includes(initial.category);

  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [category, setCategory] = useState(() => {
    if (initialIsCustom) return CUSTOM_VALUE;
    return initial?.category ?? baseCategories[0] ?? "";
  });
  const [customCategory, setCustomCategory] = useState(initialIsCustom ? initial.category : "");
  const [source, setSource] = useState(initial?.source ?? sources?.[0] ?? "");
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [addingCategory, setAddingCategory] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(String(amount).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      window.alert("Введите корректную сумму");
      return;
    }

    let finalCategory = category;
    if (category === CUSTOM_VALUE) {
      const trimmed = customCategory.trim().replace(/\s+/g, " ");
      if (!trimmed) {
        window.alert("Введите название категории");
        return;
      }
      if (onAddCategory) {
        try {
          setAddingCategory(true);
          const created = await onAddCategory(trimmed);
          finalCategory = created?.name ?? trimmed;
        } catch (err) {
          window.alert(err?.message || "Не удалось создать категорию");
          return;
        } finally {
          setAddingCategory(false);
        }
      } else {
        finalCategory = trimmed;
      }
    }

    if (!finalCategory.trim()) {
      window.alert("Выберите категорию");
      return;
    }

    onSave({
      id: initial?.id,
      amount: n,
      category: finalCategory.trim(),
      source: source.trim() || undefined,
      comment: comment.trim() || undefined,
      date,
    });
  };

  const busy = saving || addingCategory;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[min(92dvh,640px)] overflow-y-auto bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl pb-[calc(1.25rem+var(--safe-bottom))]"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold tracking-tight">
            {initial ? "Изменить" : "Новая"}{" "}
            {kind === "income" ? "запись о доходе" : "запись о расходе"}
          </h2>
          <button type="button" onClick={onClose} className="ft-touch grid place-items-center rounded-lg hover:bg-white/[0.06] text-muted-foreground" aria-label="Закрыть">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Сумма">
            <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus placeholder="0" className="ft-input" />
          </Field>
          <Field label="Категория">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="ft-input"
              disabled={categoriesLoading}
            >
              {baseCategories.map((c) => (
                <option key={c} value={c} className="bg-background">
                  {c}
                </option>
              ))}
              <option value={CUSTOM_VALUE} className="bg-background">
                ➕ Своя категория…
              </option>
            </select>
            {category === CUSTOM_VALUE && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Название новой категории"
                className="ft-input mt-2"
                maxLength={50}
              />
            )}
          </Field>
          {sources && (
            <Field label="Источник">
              <select value={source} onChange={(e) => setSource(e.target.value)} className="ft-input">
                {sources.map((c) => (
                  <option key={c} value={c} className="bg-background">
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Дата">
            <FtDatePicker value={date} onChange={setDate} maxDate={todayISO()} />
          </Field>
          <Field label={kind === "expense" ? "Описание" : "Комментарий"}>
            <input type="text" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Необязательно" className="ft-input" />
          </Field>
        </div>

        <div className="mt-7 flex items-center gap-3 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-3 min-h-[2.75rem] rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition">
            Отмена
          </button>
          <button type="submit" disabled={busy} className="px-5 py-3 min-h-[2.75rem] rounded-lg bg-emerald-glow text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-60">
            {busy ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
