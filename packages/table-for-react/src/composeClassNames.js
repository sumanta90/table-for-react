import { cx } from "./mergeSlots.js";

/** Deep-merge partial slot maps: later values append (`cx`) to earlier slots. */
export function composeClassNames(...parts) {
  const out = {};
  for (const p of parts) {
    if (!p || typeof p !== "object") continue;
    for (const key of Object.keys(p)) {
      const v = p[key];
      if (v === undefined || v === null || v === "") continue;
      out[key] = cx(out[key], v);
    }
  }
  return out;
}
