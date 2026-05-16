import React from "react";
import { currentYM, monthLabel } from "../../lib/ftUtils";

export default function AnalyticsPage() {
  const ym = currentYM();
  return (
    <>
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-2">Аналитика</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Динамика за 6 месяцев и распределение по категориям. Сегодня — {monthLabel(ym)}.
        </p>
      </header>
      <section className="bg-surface rounded-3xl border border-border p-10 sm:p-14 text-center">
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Пока нет данных для аналитики. Добавьте операции на вкладках «Доходы» и «Расходы».
        </p>
      </section>
    </>
  );
}
