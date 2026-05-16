import React from "react";

/**
 * Карточка секции аналитики — как в Lovable.
 */
export default function AnalyticsCard({ title, subtitle, children, className = "", action }) {
  return (
    <section
      className={`bg-surface rounded-3xl border border-border p-5 sm:p-7 min-w-0 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
