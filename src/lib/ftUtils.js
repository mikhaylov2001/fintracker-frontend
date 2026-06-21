import { canonicalCategoryName } from "./defaultCategories";

export const normalizeDateOnly = (d) => {
  if (!d) return "";
  const s = String(d);
  if (s.includes("T")) return s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
};

export const formatDateRu = (dateLike) => {
  const s = normalizeDateOnly(dateLike);
  const [y, m, d] = String(s || "").split("-");
  if (!y || !m || !d) return "";
  return `${d}.${m}.${y}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const currentYM = () => todayISO().slice(0, 7);

export const monthLabel = (ym) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
};

/** «Май 2026 г.» — как в истории месяцев */
export const monthLabelLong = (ym) => {
  const [y, m] = String(ym || "").split("-").map(Number);
  if (!y || !m) return "";
  const raw = new Date(y, m - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
  const cap = raw.charAt(0).toUpperCase() + raw.slice(1);
  return cap.includes("г.") ? cap : `${cap} г.`;
};

export const pluralMonthsRu = (n) => {
  const x = Math.abs(Number(n) || 0);
  const mod10 = x % 10;
  const mod100 = x % 100;
  if (mod10 === 1 && mod100 !== 11) return `${x} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${x} месяца`;
  return `${x} месяцев`;
};

export const unwrapList = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const data = raw.data ?? raw;
  if (Array.isArray(data)) return data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.data?.content && Array.isArray(data.data.content)) return data.data.content;
  return [];
};

export const mapApiError = (err, fallback) => {
  const status = err?.status;
  if (status === 503) {
    return "Сервер временно недоступен. Включите бэкенд на Render или попробуйте позже.";
  }
  const data = err?.data ?? err?.response?.data;
  if (data && typeof data === "object") {
    const msg = data.message || data.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  if (typeof data === "string" && data.trim()) return data.trim();
  if (err?.message) return err.message;
  return fallback;
};

function normalizeCategory(kind, category) {
  const raw = String(category || "").trim();
  if (!raw) return "—";
  if (kind === "income") {
    return canonicalCategoryName("INCOME", raw) || raw;
  }
  return raw;
}

export const mapApiRow = (item, kind) => ({
  id: item.id,
  amount: Number(item.amount || 0),
  category: normalizeCategory(kind, item.category),
  source: kind === "income" ? item.source : undefined,
  comment: kind === "expense" ? item.description || item.comment : item.comment,
  date: normalizeDateOnly(
    item.date ?? item.operationDate ?? item.incomeDate ?? item.createdAt
  ),
});
