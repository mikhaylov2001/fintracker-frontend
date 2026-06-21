import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CategoryField({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Выберите или введите категорию",
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value || "");

  useEffect(() => {
    setText(value || "");
  }, [value]);

  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => a.localeCompare(b, "ru"));
    if (!q) return sorted;
    return sorted.filter((c) => c.toLowerCase().includes(q));
  }, [options, text]);

  const isNew =
    text.trim() &&
    !options.some((c) => c.localeCompare(text.trim(), "ru", { sensitivity: "accent" }) === 0);

  const pick = (name) => {
    setText(name);
    onChange(name);
    setOpen(false);
  };

  const sync = (next) => {
    setText(next);
    onChange(next);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={50}
          className="ft-input pr-10 appearance-none"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(e) => sync(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && open && filtered.length === 1) {
              e.preventDefault();
              pick(filtered[0]);
            }
            if (e.key === "Escape") setOpen(false);
          }}
        />
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && filtered.length > 0 && (
        <ul
          className="absolute z-[70] left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl py-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          {filtered.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => pick(name)}
                className={`w-full text-left px-3 py-2.5 text-sm transition hover:bg-white/[0.06] ${
                  name === value ? "text-emerald-glow font-medium bg-emerald-glow/10" : "text-foreground"
                }`}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isNew && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          Новая категория: <span className="text-emerald-glow font-medium">{text.trim()}</span>
        </p>
      )}
    </div>
  );
}
