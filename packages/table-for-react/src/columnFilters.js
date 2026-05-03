/**
 * @param {Record<string, unknown>} filters — `select` cols: primitive[] · `text` cols: string
 * @param {{ key: string, mode: 'select'|'text' }[]} specs
 * @returns {Record<string, string[] | string>}
 */
export function serializeColumnFiltersPayload(filters, specs) {
  const out = {};
  for (const s of specs) {
    const raw = filters[s.key];
    if (s.mode === "text") {
      if (typeof raw === "string" && raw.trim() !== "")
        out[s.key] = raw.trim();
    } else if (Array.isArray(raw) && raw.length > 0) {
      out[s.key] = raw;
    }
  }
  return out;
}

/**
 * @param {object[]} rows
 * @param {{ key: string, mode: 'select'|'text' }[]} specs
 * @param {Record<string, unknown>} filters
 */
export function applyColumnFiltersToRows(rows, specs, filters) {
  let output = rows;
  if (!specs.length) return output;
  for (const s of specs) {
    const raw = filters[s.key];
    if (s.mode === "text") {
      const q = typeof raw === "string" ? raw.trim().toLowerCase() : "";
      if (!q) continue;
      output = output.filter((row) =>
        String(row[s.key] ?? "")
          .toLowerCase()
          .includes(q)
      );
    } else if (Array.isArray(raw) && raw.length > 0) {
      const setVals = raw;
      output = output.filter((row) =>
        setVals.some((rv) => Object.is(rv, row[s.key]))
      );
    }
  }
  return output;
}
