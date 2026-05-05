# table-for-react

A React table/card component that stays **easy to pair with Tailwind**, **Ant Design**, **your own CSS**, or **plain variables** — without locking you into one styling system.

### Do give me a star on github : [Table for React](https://github.com/sumanta90/table-for-react)
### Demo you can try on local: [Demo](https://github.com/sumanta90/table-for-react/tree/main/table-for-react-demo)
### Examples: [Here](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/examples.md)
## Install

```bash
npm install table-for-react react react-dom
```

## Overall tabvle view
![Primary Demo](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/primary-demo.png "Primary demo")

### Card view with Grid layout
![Card view with Grid layout](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/card-view-grid-layout.png "card view")

### Card view with list layout
![Card view with Grid layout](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/card-view-list-layout.png, "card view")

### Column filter option using contains
![column filter option](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/column-filter-option-contains.png "column filter option")

### column filter option using select
![column filter option](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/column-filter-option.png "column select filter option")


### Select columns on runtime.
![select columns on runtime](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/control-columns-on-view.png "select column on runtime")


### export specific columns as CSV
![export selected](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/export%20specific.png "export sdelected columns")


### Render additional actions buttons
![render action buttons](https://github.com/sumanta90/table-for-react/blob/docs/table-for-react-demo/table-for-react-demo-images/render-action-buttons.png "render action buttons")




## Quick patterns

### 1. Semantic CSS (works with vanilla CSS / any preprocessor)

Uses BEM-ish class names (`smart-table`, `smart-table__th`, …). Import the minimal layout stylesheet and override with `--smart-table-*` variables or plain CSS selectors.

```jsx
import { SmartTable } from "table-for-react";
import "table-for-react/base.css";

<SmartTable appearance="minimal" columns={columns} data={rows} />;
```

Tune colors / borders globally:

```css
:root .smart-table {
  --smart-table-border: var(--antd-color-border-secondary, #eee);
}
```

### 2. Tailwind utility preset

Uses the bundled slot map **`tailwindClassNames`** (utilities as strings).

```jsx
import { SmartTable } from "table-for-react";

<SmartTable appearance="tailwind" columns={columns} />;
```

Ensure your Tailwind scanner sees the utilities (often already does if you `@source` package sources or reuse the preset in your outer app). Prefer adding the package folder to `@source` in Tailwind v4 if classes are purged unexpectedly — e.g. in your global CSS alongside `@import "tailwindcss"`:

```css
@import "tailwindcss";
@source "../../node_modules/table-for-react/src/**/*.{js,jsx}";
```

**Important for card view:** with **`appearance="tailwind"`**, also import **`table-for-react/base.css`**. Responsive **grid/list** layout for cards uses semantic classes (`smart-table__card-grid`, …); that keeps cards working even when Tailwind does not scan the library.

Per-slot **replace** (`classNames`):

```jsx
<SmartTable
  appearance="tailwind"
  classNames={{
    root: "w-full max-w-screen-lg rounded-xl border mx-auto shadow-sm",
    searchInput: "rounded-md border-orange-400",
  }}
/>
```

**Append** more utilities everywhere without copying the full preset:

```jsx
<SmartTable
  appearance="tailwind"
  appendClassNames={{
    root: "backdrop-blur-sm",
    pagination: "sticky bottom-0 bg-white pt-4",
  }}
/>
```

Build a reusable map with **`composeClassNames`** (chains `cx()` per slot; often used with **`appearance="minimal"`** and your Tailwind snippets):

```jsx
import {
  composeClassNames,
  defaultClassNames,
} from "table-for-react";

const mySlots = composeClassNames(defaultClassNames, {
  root: "rounded-2xl border-dashed shadow-none",
});

<SmartTable appearance="minimal" classNames={mySlots} />;
```

### 3. Ant Design (component swap)

Plug in primitives so buttons/inputs/checkboxes render as Antd components:

```jsx
import { Button, Checkbox, Input } from "antd";
import { SmartTable } from "table-for-react";
import "table-for-react/base.css";

<SmartTable
  appearance="minimal"
  components={{
    Button: (p) => <Button {...p} size="middle" type="primary" />,
    Input: (p) => <Input {...p} allowClear />,
    Checkbox: ({ className, ...p }) => (
      <Checkbox {...p} className={className} />
    ),
  }}
/>
```

If Ant Design and the preset both style buttons, replace those slots—for example **`classNames={{ exportPrimaryButton: "!min-h-0 rounded-md" }}`**—or **`appendClassNames`** to layer utilities.

Map Antd `Typography`/`Table`-level styling separately if you mirror their typography around the widget.

### Slots API

Exported helpers:

| Export | Purpose |
|--------|---------|
| `defaultClassNames` | `appearance="minimal"` slot map |
| `tailwindClassNames` | Tailwind utility slot map |
| `composeClassNames()` | Concatenate partial slot overrides |
| `mergeSlots()`, `appendSlots()`, `cx` | Merge / concatenate class lists |

Inspect `src/defaultClassNames.js` / `tailwindClassNames.js` for slot keys (`toolbar`, `th`, `pageButton`, …).

## Props (styling subset)

| Prop | Purpose |
|------|---------|
| `appearance` | `"minimal"` (default) semantic classes · `"tailwind"` preset |
| `classNames` | Partial slot overrides (replace preset per key) |
| `appendClassNames` | Concatenate utilities after `classNames` |
| `components` | `{ Button, Input, Checkbox }` custom elements |

### Sorting

- Column def: `{ key, label, sort: true }` enables sorting for that column.
- `sortAll`: when `true`, every column is sortable; when `false`, none. **Ignores `sort` on columns** when this is a boolean.
- If `sortAll` is omitted: use legacy `sortColumns={['key']}` if non-empty, otherwise use each column’s `sort`.
- Headers show **▲** and **▼**; the active direction is emphasized. Rows are sorted client-side (including the current page when using server pagination).

### Column value formats (`format`)

When a column has no **`render`**, **`format`** controls how **`row[column.key]`** is shown (table cells and the default card view). Sorting still uses the raw **`row[key]`** value.

- **`{ type: "number", locale?, …Intl.NumberFormatOptions }`** — decimals, grouping, notation, etc.
- **`{ type: "currency", currency: "USD", locale?, currencyDisplay?, customSymbol?, minimumFractionDigits?, maximumFractionDigits? }`** — `currencyDisplay` is passed to Intl (`symbol`, `narrowSymbol`, `code`, **`name`**). **`customSymbol`** overrides the Intl currency prefix/suffix with a literal string plus formatted digits.
- **`{ type: "percentage", valueScale?: "ratio" | "percent", locale?, decimals? | minimumFractionDigits? / maximumFractionDigits? }`** — **`valueScale: "ratio"`** (default): store **0–1** (e.g. `0.42` → `42%`). **`valueScale: "percent"`**: store whole percents (**0–100**, e.g. `12.5` → `12.5%`).

Optional **`nullDisplay`** replaces empty / **`null`** / **`undefined`**.

You can **`import { formatDisplayValue } from "table-for-react"`** for previews or tooling.

### Synthetic / action columns (not in API)

Use a **`key`** that your rows do not have (e.g. `__actions`) and **`render: (row) => …`** for buttons or links — the cell ignores `row[key]` when `render` is set.

- Do **not** set **`sort: true`** on pure UI columns unless you also store a comparable value under `key`.
- **`exportable: false`** omits that column from CSV export (otherwise the file would export an empty cells column).

### Card view (`viewMode="card"`)

- **`cardLayout`** — **`"grid"`** (default): responsive **CSS grid** of cards (**`repeat(auto-fill, minmax(...))`** in `base.css`). **`"list"`**: **flex column** of full‑width stacked cards.
- **Slot styling** — override **`classNames.cardGrid`**, **`cardGrid_list`**, **`cardItem`**, **`cardFields`**, **`card`**, etc., or use **`appendClassNames`** to layer utilities (e.g. your own Tailwind grid).
- **Whole card** — **`cardRenderer={(row, isSelected, toggleSelect) => …}`** replaces the built-in card body (you control layout and content).
- **Outer / per-item shell** — keep the built-in card body but change how cards are arranged:
  - **`renderCardGrid={({ children, className, layout }) => …}`** — replace the outer wrapper that holds all cards. You usually spread **`className`** onto your root (or drop it and use your own). **`layout`** is **`"grid"`** or **`"list"`** (same as **`cardLayout`**).
  - **`renderCardItem={({ row, index, rowKey, className, children }) => …}`** — replace each card’s outer wrapper (default: **`div`** + **`cardItem`**). Use with **`renderCardGrid`** for a semantic list, e.g. **`ul`** / **`li`**.

```jsx
<SmartTable
  viewMode="card"
  renderCardGrid={({ children, className }) => (
    <ul className={className} role="list">
      {children}
    </ul>
  )}
  renderCardItem={({ className, children }) => (
    <li className={className}>{children}</li>
  )}
  /* … */
/>
```

### Column filters (**table view only**, `enableColumnFilters`)

Per-column filtering is driven by **`column.filter`** (**`"select"`** or **`"text"`**) or the legacy **`filterColumns`** prop (those keys behave like **`select`**). **`enableColumnFilters`** must be **`true`**.

- **Predicate + UI** apply only when **`viewMode !== "card"`**. In **card view** active filters stay in state but are **not** applied to rows; the header filter panel is hidden. Closing the panel when switching modes is handled internally (`openFilter` reset).
- **`"select"`** — distinct primitive values from the current dataset (**after** search / show-selected narrowing, **before** column filters); multi-select equality on **`row[key]`**.
- **`"text"`** — substring match, case-insensitive, on **`String(row[key] ?? '')`**.
- **Always client-side**: filters are applied only to **`orderedData`**—whatever is currently in memory. With **`enableServerData`**, that is typically **one server page**, so **`select`** options and matching rows reflect that slice only (search can still hit the server via **`serverConfig.searchParam`** if configured).

Helpers (optional tooling or custom export pipelines):

- **`import { serializeColumnFiltersPayload, applyColumnFiltersToRows } from "table-for-react"`**.

### Pagination (`enablePagination`, `pageSize`)

Set **`pageSize`** from your own state and pass **`pageSizeOptions`** (**`number[]`**) plus **`onPageSizeChange={(n) => …}`** to show a **Rows per page** `<select>` beside **Prev / Next**. Slots: **`paginationPageSizeWrap`**, **`paginationPageSizeLabel`**, **`pageSizeSelect`**, **`paginationNav`**.

### Search (`enableSearch`)

- **Local rows** (`enableServerData` off): searches the dataset in-memory.
- **Server mode**: set **`serverConfig.searchParam`** (e.g. **`"q"`**) so the trimmed query is sent on each fetch. Omit **`searchParam`** to keep search client-side **only over the loaded page**.
- Backend should read that param (e.g. **`?q=...`**) filter the full list, then paginate and return **`total`** for that filtered list.

Other table props (`columns`, `data`, `enableServerData`, `serverConfig`, …) work as before.

## License

MIT
