import React from "react";

/**
 * Переключатель-сегменты: тёмная капсула, активный — зелёная «таблетка».
 */
export default function SegmentToggle({
  value,
  onChange,
  options,
  className = "",
  pill = true,
  stretch = false,
}) {
  return (
    <div
      className={`ft-segment-bar ${stretch ? "!w-full" : ""} ${className}`}
      role="tablist"
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`ft-segment-btn ${pill ? "" : "!rounded-lg"} ${
              active ? opt.activeClass || "ft-segment-active" : ""
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
