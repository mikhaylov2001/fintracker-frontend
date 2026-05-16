export function validatePassword(v) {
  if (!v) return "Введите пароль";
  if (v.length < 8) return "Минимум 8 символов";
  if (!/[A-ZА-ЯЁ]/.test(v)) return "Нужна хотя бы одна заглавная буква";
  if (!/[a-zа-яё]/.test(v)) return "Нужна хотя бы одна строчная буква";
  if (!/[0-9]/.test(v)) return "Нужна хотя бы одна цифра";
  return "";
}

export function validateName(v, label, { required = true } = {}) {
  const t = String(v || "").trim();
  if (!t) return required ? `Введите ${label}` : "";
  if (t.length < 2) return `${label} слишком короткое`;
  return "";
}
