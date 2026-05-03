/** @typedef {Record<string, string | undefined>} ClassNameSlots */

export const cx = (...parts) =>
  parts
    .filter((p) => p != null && String(p).trim() !== "")
    .join(" ")
    .trim();

/**
 * @param {ClassNameSlots} defaults
 * @param {Partial<ClassNameSlots> | undefined} overrides
 * @returns {ClassNameSlots}
 */
export function mergeSlots(defaults, overrides) {
  if (!overrides || typeof overrides !== "object") return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (
      overrides[key] !== undefined &&
      overrides[key] !== null &&
      overrides[key] !== ""
    )
      out[key] = overrides[key];
  }
  return out;
}

/**
 * Overlay user slot classes on defaults (Tailwind+BEM coexist).
 *
 * @param {ClassNameSlots} defaults
 * @param {Partial<ClassNameSlots> | undefined} extra
 */
export function appendSlots(defaults, extra) {
  if (!extra || typeof extra !== "object") return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(extra)) {
    if (extra[key] !== undefined && extra[key] !== null && extra[key] !== "")
      out[key] = cx(defaults[key], extra[key]);
  }
  return out;
}
