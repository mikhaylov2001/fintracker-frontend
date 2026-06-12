import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTransactionCategories } from "../../hooks/useTransactionCategories";

export default function CategoryManager({ type, title, description }) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const { categories, loading, addCategory, deleteCategory } = useTransactionCategories(type, {
    enabled: true,
    onError: (msg) => setError(msg),
  });

  const onAdd = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = newName.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setError("Введите название категории");
      return;
    }

    setAdding(true);
    try {
      await addCategory(trimmed);
      setNewName("");
    } catch (err) {
      setError(err?.message || "Не удалось добавить категорию");
    } finally {
      setAdding(false);
    }
  };

  const onDelete = async (category) => {
    if (!category.id) return;
    if (!window.confirm(`Удалить категорию «${category.name}»?`)) return;

    setDeletingId(category.id);
    setError("");
    try {
      await deleteCategory(category.id);
    } catch (err) {
      setError(err?.message || "Не удалось удалить категорию");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="bg-surface rounded-3xl border border-border p-6 sm:p-8">
      <h2 className="text-lg font-bold mb-1">{title}</h2>
      <p className="text-xs text-muted-foreground mb-5">{description}</p>

      <form onSubmit={onAdd} className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новая категория"
          className="ft-input flex-1"
          maxLength={50}
        />
        <button
          type="submit"
          disabled={adding}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[2.75rem] rounded-xl bg-emerald-glow text-primary-foreground text-sm font-semibold hover:brightness-110 transition disabled:opacity-60 shrink-0"
        >
          <Plus className="size-4" />
          {adding ? "Добавление…" : "Добавить"}
        </button>
      </form>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка категорий…</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {categories.map((category) => (
            <li
              key={category.id ?? category.name}
              className="flex items-center justify-between gap-3 px-4 py-3 bg-white/[0.01]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{category.name}</p>
                {category.system && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">Стандартная</p>
                )}
              </div>
              {category.id && (
                <button
                  type="button"
                  onClick={() => onDelete(category)}
                  disabled={deletingId === category.id}
                  className="ft-touch grid place-items-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition disabled:opacity-50"
                  aria-label={`Удалить ${category.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
