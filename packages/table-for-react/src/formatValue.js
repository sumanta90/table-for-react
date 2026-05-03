/**
 * Column `format` shapes (subset passed to Intl + helpers):
 * - `{ type: "number", locale?, ...IntlNumberFormatOptions }`
 * - `{ type: "currency", currency: "USD", locale?, currencyDisplay?, customSymbol?, ... }`
 * - `{ type: "percentage", valueScale?: "ratio" | "percent", locale?, decimals?, ... }`
 */

/**
 * @param {unknown} value
 * @param {object | null | undefined} format
 */
export function formatDisplayValue(value, format) {
  if (format == null || typeof format !== "object" || !format.type) {
    if (value == null) return "";
    return value;
  }

  const nullDisplay =
    "nullDisplay" in format && format.nullDisplay != null
      ? String(format.nullDisplay)
      : "";

  if (value == null || value === "") return nullDisplay;

  const n = typeof value === "number" ? value : Number(value);
  const locale =
    "locale" in format && format.locale != null
      ? String(format.locale)
      : undefined;

  const notNumeric = !Number.isFinite(n);

  switch (format.type) {
    case "number": {
      if (notNumeric) return String(value);
      const { type, nullDisplay: _nd, ...intlOpts } = format;
      void type;
      void _nd;
      return new Intl.NumberFormat(locale, intlOpts).format(n);
    }
    case "currency": {
      if (notNumeric) return String(value);
      const code =
        "currency" in format && format.currency != null
          ? String(format.currency).trim().toUpperCase()
          : "";
      if (!code) return String(value);

      if (
        "customSymbol" in format &&
        format.customSymbol != null &&
        format.customSymbol !== ""
      ) {
        const sym = String(format.customSymbol);
        const min =
          "minimumFractionDigits" in format
            ? format.minimumFractionDigits
            : 2;
        const max =
          "maximumFractionDigits" in format
            ? format.maximumFractionDigits
            : min ?? 2;
        const dec = new Intl.NumberFormat(locale, {
          minimumFractionDigits: min ?? undefined,
          maximumFractionDigits: max ?? undefined,
        });
        const sign = n < 0 ? "-" : "";
        const body = dec.format(Math.abs(n));
        return `${sign}${sym}${body}`;
      }

      const display =
        "currencyDisplay" in format &&
        (format.currencyDisplay === "narrowSymbol" ||
          format.currencyDisplay === "symbol" ||
          format.currencyDisplay === "code" ||
          format.currencyDisplay === "name")
          ? format.currencyDisplay
          : "symbol";

      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay: display,
        minimumFractionDigits:
          "minimumFractionDigits" in format
            ? format.minimumFractionDigits
            : undefined,
        maximumFractionDigits:
          "maximumFractionDigits" in format
            ? format.maximumFractionDigits
            : undefined,
      }).format(n);
    }
    case "percentage": {
      if (notNumeric) return String(value);
      const scale =
        "valueScale" in format && format.valueScale === "percent"
          ? n / 100
          : n;
      let min = 0;
      let max = 3;
      if ("decimals" in format && typeof format.decimals === "number") {
        min = max = format.decimals;
      }
      if ("minimumFractionDigits" in format)
        min = /** @type {number} */ (format.minimumFractionDigits);
      if ("maximumFractionDigits" in format)
        max = /** @type {number} */ (format.maximumFractionDigits);
      if (max < min) max = min;
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      }).format(scale);
    }
    default:
      return String(value);
  }
}
