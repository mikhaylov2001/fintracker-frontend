import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Coins,
  Lock,
  Trash2,
  Download,
  Upload,
  Shield,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useToast } from "../../contexts/ToastContext";
import { useIncomeApi } from "../../api/incomeApi";
import { useExpensesApi } from "../../api/expensesApi";
import { useSummaryApi } from "../../api/summaryApi";
import { mapApiError } from "../../lib/ftUtils";
import { validateName, validatePassword } from "../../lib/authValidation";
import {
  deleteAllUserData,
  downloadJsonBackup,
  fetchAllUserData,
  importBackupFile,
  toBackupPayload,
} from "../../lib/dataBackup";

export default function SettingsPage() {
  const toast = useToast();
  const { user, updateProfile, updateSettings, changePassword, deleteData } = useAuth();
  const { currency, setCurrency, hideAmounts, setHideAmounts } = useCurrency();
  const incomeApi = useIncomeApi();
  const expensesApi = useExpensesApi();
  const summaryApi = useSummaryApi();
  const fileRef = useRef(null);

  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [counts, setCounts] = useState({ income: 0, expenses: 0 });

  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currency: "RUB",
    hideAmounts: false,
  });

  const [profileErrors, setProfileErrors] = useState({ firstName: "", lastName: "" });

  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdErrors, setPwdErrors] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);

  useEffect(() => {
    setDraft({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currency: currency || "RUB",
      hideAmounts: !!hideAmounts,
    });
  }, [user, currency, hideAmounts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { income, expenses } = await fetchAllUserData({
          incomeApi,
          expensesApi,
          summaryApi,
        });
        if (!cancelled) {
          setCounts({ income: income.length, expenses: expenses.length });
        }
      } catch {
        if (!cancelled) setCounts({ income: 0, expenses: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [incomeApi, expensesApi, summaryApi]);

  const onSaveProfile = async () => {
    const fnErr = validateName(draft.firstName, "имя", { required: true });
    const lnErr = validateName(draft.lastName, "фамилию", { required: false });
    setProfileErrors({ firstName: fnErr, lastName: lnErr });
    if (fnErr || lnErr) return;

    setSavingProfile(true);
    try {
      await updateProfile({
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
      });
      await updateSettings({
        displayCurrency: draft.currency,
        hideAmounts: draft.hideAmounts,
      });
      setCurrency(draft.currency);
      setHideAmounts(draft.hideAmounts);
      setProfileSaved(true);
      toast.success("Профиль сохранён");
      setTimeout(() => setProfileSaved(false), 1800);
    } catch (e) {
      toast.error(mapApiError(e, "Не удалось сохранить профиль"));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);

    const curErr = !pwd.current ? "Введите текущий пароль" : "";
    const nextErr = validatePassword(pwd.next);
    const confirmErr =
      !pwd.confirm
        ? "Подтвердите новый пароль"
        : pwd.next !== pwd.confirm
          ? "Пароли не совпадают"
          : "";
    setPwdErrors({ current: curErr, next: nextErr, confirm: confirmErr });
    if (curErr || nextErr || confirmErr) return;

    setSavingPassword(true);
    try {
      await changePassword(pwd.current, pwd.next);
      setPwd({ current: "", next: "", confirm: "" });
      setPwdErrors({ current: "", next: "", confirm: "" });
      setPwMsg({ type: "ok", text: "Пароль успешно изменён" });
      toast.success("Пароль изменён");
      setTimeout(() => setPwMsg(null), 2800);
    } catch (err) {
      const text = mapApiError(err, "Не удалось изменить пароль");
      setPwMsg({ type: "err", text });
      toast.error(text);
    } finally {
      setSavingPassword(false);
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const { income, expenses } = await fetchAllUserData({
        incomeApi,
        expensesApi,
        summaryApi,
      });
      const payload = toBackupPayload({
        user: {
          firstName: draft.firstName,
          lastName: draft.lastName,
          email: draft.email,
        },
        settings: {
          displayCurrency: draft.currency,
          hideAmounts: draft.hideAmounts,
        },
        income,
        expenses,
      });
      downloadJsonBackup(payload);
      setCounts({ income: income.length, expenses: expenses.length });
      toast.success("Резервная копия скачана");
    } catch (e) {
      toast.error(mapApiError(e, "Не удалось экспортировать данные"));
    } finally {
      setExporting(false);
    }
  };

  const onImport = async (file) => {
    if (!file) return;
    if (
      !window.confirm(
        "Импорт добавит операции из файла к существующим на сервере. Продолжить?"
      )
    ) {
      return;
    }

    setImporting(true);
    try {
      const { incomeCount, expenseCount } = await importBackupFile(file, {
        incomeApi,
        expensesApi,
      });
      const { income, expenses } = await fetchAllUserData({
        incomeApi,
        expensesApi,
        summaryApi,
      });
      setCounts({ income: income.length, expenses: expenses.length });
      toast.success(`Импортировано: ${incomeCount} доходов, ${expenseCount} расходов`);
    } catch (e) {
      toast.error(mapApiError(e, "Не удалось прочитать файл"));
    } finally {
      setImporting(false);
    }
  };

  const onClearAll = async () => {
    if (
      !window.confirm(
        "Удалить ВСЕ доходы и расходы на сервере? Действие необратимо."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const { income, expenses } = await fetchAllUserData({
        incomeApi,
        expensesApi,
        summaryApi,
      });
      await deleteAllUserData({
        deleteData,
        summaryApi,
        income,
        expenses,
      });
      setCounts({ income: 0, expenses: 0 });
      toast.success("Все операции удалены");
    } catch (e) {
      toast.error(mapApiError(e, "Не удалось удалить данные"));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
          Настройки
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Профиль, безопасность и отображение. Данные синхронизируются с аккаунтом на сервере.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Профиль */}
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-1">Профиль</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Имя и фамилия отображаются в меню и на дашборде.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Имя" icon={User} error={profileErrors.firstName}>
              <input
                className="ft-input"
                value={draft.firstName}
                onChange={(e) => {
                  setDraft({ ...draft, firstName: e.target.value });
                  if (profileErrors.firstName) {
                    setProfileErrors((p) => ({
                      ...p,
                      firstName: validateName(e.target.value, "имя", { required: true }),
                    }));
                  }
                }}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Фамилия" icon={User} error={profileErrors.lastName}>
              <input
                className="ft-input"
                value={draft.lastName}
                onChange={(e) => {
                  setDraft({ ...draft, lastName: e.target.value });
                  if (profileErrors.lastName) {
                    setProfileErrors((p) => ({
                      ...p,
                      lastName: validateName(e.target.value, "фамилию", { required: false }),
                    }));
                  }
                }}
                autoComplete="family-name"
              />
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Email" icon={Mail}>
              <input
                type="email"
                className="ft-input opacity-70"
                value={draft.email}
                disabled
                readOnly
              />
            </Field>
            <Field label="Валюта" icon={Coins}>
              <select
                className="ft-input"
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              >
                <option value="RUB" className="bg-background">
                  Российский рубль (₽)
                </option>
                <option value="USD" className="bg-background">
                  US Dollar ($)
                </option>
                <option value="EUR" className="bg-background">
                  Euro (€)
                </option>
              </select>
            </Field>
          </div>

          <label className="mt-5 flex items-start gap-3 cursor-pointer group">
            <span className="relative inline-flex shrink-0 mt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={draft.hideAmounts}
                onChange={(e) => setDraft({ ...draft, hideAmounts: e.target.checked })}
              />
              <span className="size-5 rounded-md border border-border bg-white/[0.04] peer-checked:bg-emerald-glow peer-checked:border-emerald-glow transition-all grid place-items-center">
                <CheckCircle2 className="size-3.5 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity" />
              </span>
            </span>
            <span className="text-sm text-foreground/90 flex items-center gap-2">
              <Eye className="size-3.5 text-muted-foreground shrink-0" />
              Скрывать суммы на экране
            </span>
          </label>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={savingProfile}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[2.75rem] rounded-xl bg-emerald-glow text-primary-foreground text-sm font-semibold hover:brightness-110 transition shadow-[0_0_20px_oklch(0.72_0.18_162/0.35)] disabled:opacity-60"
            >
              {savingProfile ? "Сохранение…" : "Сохранить профиль"}
            </button>
            {profileSaved && (
              <span className="text-xs text-emerald-glow font-medium flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Сохранено
              </span>
            )}
          </div>
        </section>

        {/* Безопасность */}
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Shield className="size-4 text-emerald-glow shrink-0" />
            Безопасность
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Смена пароля для входа по email. Минимум 8 символов, заглавная, строчная и цифра.
          </p>

          <form onSubmit={onChangePassword} className="space-y-4">
            <Field label="Текущий пароль" icon={Lock} error={pwdErrors.current}>
              <input
                type="password"
                className="ft-input"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                autoComplete="current-password"
              />
            </Field>
            <Field label="Новый пароль" icon={Lock} error={pwdErrors.next}>
              <input
                type="password"
                className="ft-input"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Повторите пароль" icon={Lock} error={pwdErrors.confirm}>
              <input
                type="password"
                className="ft-input"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                autoComplete="new-password"
              />
            </Field>

            {pwMsg && (
              <div
                className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                  pwMsg.type === "ok"
                    ? "bg-emerald-glow/10 text-emerald-glow border border-emerald-glow/30"
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {pwMsg.type === "ok" ? (
                  <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                )}
                <span>{pwMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full sm:w-auto px-5 py-2.5 min-h-[2.75rem] rounded-xl border border-emerald-glow/40 text-emerald-glow text-sm font-semibold hover:bg-emerald-glow/10 transition disabled:opacity-60"
            >
              {savingPassword ? "Сохранение…" : "Сменить пароль"}
            </button>
          </form>
        </section>

        {/* Данные */}
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-bold mb-1">Данные</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Резервная копия и сброс. Сейчас: {counts.income} доходов, {counts.expenses}{" "}
            расходов.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[2.75rem] rounded-xl border border-border hover:bg-white/[0.04] text-sm font-medium transition disabled:opacity-60"
            >
              <Download className="size-4 text-emerald-glow shrink-0" />
              {exporting ? "Экспорт…" : "Экспорт JSON"}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="flex items-center justify-center gap-2 px-4 py-3 min-h-[2.75rem] rounded-xl border border-border hover:bg-white/[0.04] text-sm font-medium transition disabled:opacity-60"
            >
              <Upload className="size-4 text-info shrink-0" />
              {importing ? "Импорт…" : "Импорт JSON"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImport(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Опасная зона</p>
            <button
              type="button"
              onClick={onClearAll}
              disabled={deleting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 min-h-[2.75rem] rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/15 transition disabled:opacity-60"
            >
              <Trash2 className="size-4 shrink-0" />
              {deleting ? "Удаление…" : "Удалить все операции"}
            </button>
          </div>
        </section>

        {/* О приложении */}
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-bold mb-1">О приложении</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-4">
            FinTrackerPro v1.0 — личный финансовый трекер. Доходы и расходы хранятся в облаке и
            доступны после входа с любого устройства.
          </p>
        </section>
      </div>
    </>
  );
}

function Field({ label, icon: Icon, error, children }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3 shrink-0" />
        {label}
      </span>
      {children}
      {error ? <span className="text-[11px] text-destructive mt-1 block">{error}</span> : null}
    </label>
  );
}
