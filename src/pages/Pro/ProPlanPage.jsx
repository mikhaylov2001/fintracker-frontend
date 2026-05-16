import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function ProPlanPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition"
      >
        <ArrowLeft className="size-4" />
        Назад
      </button>

      <div className="bg-surface rounded-3xl border border-border p-8 sm:p-10 text-center">
        <div className="size-14 rounded-2xl bg-emerald-glow/15 border border-emerald-glow/25 grid place-items-center mx-auto mb-5">
          <Sparkles className="size-7 text-emerald-glow" strokeWidth={2} />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">PRO план</h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Раздел ещё в разработке. Скоро появятся расширенная аналитика и синхронизация с банками.
        </p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-lg bg-emerald-glow text-primary-foreground text-sm font-semibold hover:brightness-110 transition"
        >
          Вернуться назад
        </button>
      </div>
    </div>
  );
}
