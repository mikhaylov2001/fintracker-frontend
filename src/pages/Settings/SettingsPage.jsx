import React, { useEffect, useState } from "react";
import { User, Mail, Coins, Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useToast } from "../../contexts/ToastContext";
import { mapApiError } from "../../lib/ftUtils";
import { validateName, validatePassword } from "../../lib/authValidation";

export default function SettingsPage() {
  const toast = useToast();
  const { user, updateProfile, updateSettings, changePassword } = useAuth();
  const { currency, setCurrency, hideAmounts, setHideAmounts } = useCurrency();

  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currency: "RUB",
    hideAmounts: false,
  });

  const [profileErrors, setProfileErrors] = useState({ firstName: "", lastName: "" });

  const [pwd, setPwd] = useState({
    current: "",
    next: "",
    confirm: "",
  });
  const [pwdErrors, setPwdErrors] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    setDraft({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currency: currency || "RUB",
      hideAmounts: !!hideAmounts,
    });
  }, [user, currency, hideAmounts]);

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

  const onChangePassword = async () => {
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
      toast.success("Пароль изменён");
    } catch (e) {
      toast.error(mapApiError(e, "Не удалось изменить пароль"));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Настройки</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Профиль, безопасность и отображение. Данные синхронизируются с аккаунтом на сервере.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl">
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-1">Профиль</h2>
          <p className="text-xs text-muted-foreground mb-6">Имя и фамилия отображаются в меню и на дашборде.</p>
          <div className="space-y-4">
            <Field label="Имя" icon={User} error={profileErrors.firstName}>
              <input
                className="ft-input"
                value={draft.firstName}
                onChange={(e) => {
                  setDraft({ ...draft, firstName: e.target.value });
                  if (profileErrors.firstName) {
                    setProfileErrors((p) => ({
                      ...p,
                      firstName: validateName(e.target.value, "имя"),
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
            <Field label="Email" icon={Mail}>
              <input type="email" className="ft-input opacity-70" value={draft.email} disabled readOnly />
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
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={draft.hideAmounts}
                onChange={(e) => setDraft({ ...draft, hideAmounts: e.target.checked })}
                className="rounded border-border"
              />
              Скрывать суммы на экране
            </label>
          </div>
          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={savingProfile}
              className="px-5 py-2 rounded-lg bg-emerald-glow text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
            >
              {savingProfile ? "Сохранение…" : "Сохранить профиль"}
            </button>
            {profileSaved && <span className="text-xs text-emerald-glow font-medium">Сохранено ✓</span>}
          </div>
        </section>

        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-1">Безопасность</h2>
          <p className="text-xs text-muted-foreground mb-6">
            Смена пароля для входа по email. Минимум 8 символов, заглавная, строчная и цифра.
          </p>
          <div className="space-y-4">
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
          </div>
          <div className="mt-7">
            <button
              type="button"
              onClick={onChangePassword}
              disabled={savingPassword}
              className="px-5 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-white/[0.04] transition disabled:opacity-60"
            >
              {savingPassword ? "Сохранение…" : "Сменить пароль"}
            </button>
          </div>
        </section>

        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8 lg:col-span-2">
          <h2 className="text-lg font-bold mb-1">О приложении</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mt-4">
            FinTrackerPro — личный финансовый трекер. Доходы и расходы хранятся в облаке и доступны после входа
            с любого устройства.
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
        <Icon className="size-3" />
        {label}
      </span>
      {children}
      {error ? <span className="text-[11px] text-red-400 mt-1 block">{error}</span> : null}
    </label>
  );
}
