/** Общая сборка списков: сначала defaults, затем уникальные extras */
export function buildOptionList(defaults, ...nameSources) {
  const seen = new Set(defaults.map((n) => n.toLowerCase()));
  const result = [...defaults];
  for (const source of nameSources) {
    const list = Array.isArray(source) ? source : [source];
    for (const raw of list) {
      const name = String(raw || "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(name);
    }
  }
  return result;
}
