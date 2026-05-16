import React, { useEffect, useState } from "react";
import { User, Mail, Coins } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { useToast } from "../../contexts/ToastContext";
import { mapApiError } from "../../lib/ftUtils";

export default function SettingsPage() {
  const toast = useToast();
  const { user, updateProfile, updateSettings } = useAuth();
  const { currency, setCurrency, hideAmounts, setHideAmounts } = useCurrency();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currency: "RUB",
    hideAmounts: false,
  });

  useEffect(() => {
    setDraft({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      currency: currency || "RUB",
      hideAmounts: !!hideAmounts,
    });
  }, [user, currency, hideAmounts]);

  const onSave = async () => {
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
      setSaved(true);
      toast.success("Настройки сохранены");
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      toast.error(mapApiError(e, "Не удалось сохранить настройки"));
    }
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Настройки</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Профиль и отображение. Данные синхронизируются с вашим аккаунтом на сервере.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
          <h2 className="text-lg font-bold mb-1">Профиль</h2>
          <p className="text-xs text-muted-foreground mb-6">Как к вам обращаться в приложении.</p>
          <div className="space-y-4">
            <Field label="Имя" icon={User}>
              <input
                className="ft-input"
                value={draft.firstName}
                onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
              />
            </Field>
            <Field label="Фамилия" icon={User}>
              <input
                className="ft-input"
                value={draft.lastName}
                onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              />
            </Field>
            <Field label="Email" icon={Mail}>
              <input type="email" className="ft-input" value={draft.email} disabled readOnly />
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
              onClick={onSave}
              className="px-5 py-2 rounded-lg bg-emerald-glow text-primary-foreground text-sm font-semibold hover:brightness-110 transition"
            >
              Сохранить
            </button>
            {saved && <span className="text-xs text-emerald-glow font-medium">Сохранено ✓</span>}
          </div>
        </section>

        <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
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

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <Icon className="size-3" />
        {label}
      </span>
      {children}
    </label>
  );
}
