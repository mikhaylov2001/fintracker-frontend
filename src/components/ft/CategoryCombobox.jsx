import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CategoryCombobox({
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = "Выберите или введите категорию",
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");

  useEffect(() => {
    setQuery(value || "");
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
    const q = query.trim().toLowerCase();
    const sorted = [...options].sort((a, b) => a.localeCompare(b, "ru"));
    if (!q) return sorted;
    return sorted.filter((c) => c.toLowerCase().includes(q));
  }, [options, query]);

  const pick = (name) => {
    setQuery(name);
    onChange(name);
    setOpen(false);
  };

  const commitQuery = () => {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (trimmed) {
      onChange(trimmed);
      setQuery(trimmed);
    }
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={50}
          className="ft-input pr-10"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (open && filtered.length === 1) {
                pick(filtered[0]);
              } else {
                commitQuery();
              }
            }
            if (e.key === "Escape") {
              setOpen(false);
            }
            if (e.key === "ArrowDown" && !open) {
              setOpen(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(commitQuery, 120);
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => {
            inputRef.current?.focus();
            setOpen((o) => !o);
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 ft-touch grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition"
          aria-label="Показать категории"
        >
          <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && filtered.length > 0 && (
        <ul
          className="absolute z-[70] left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border bg-surface shadow-2xl py-1"
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

      {open && query.trim() && !filtered.some((c) => c.toLowerCase() === query.trim().toLowerCase()) && (
        <p className="mt-1.5 text-[11px] text-muted-foreground px-0.5">
          Новая категория: <span className="text-emerald-glow font-medium">{query.trim()}</span>
        </p>
      )}
    </div>
  );
}
