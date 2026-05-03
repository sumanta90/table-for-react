# `table-for-react` — examples from the demo app

This document breaks the large [`src/App.jsx`](src/App.jsx) into focused examples. Together they cover everything the demo uses today, plus a few common variants from the library API that the demo does not wire up.

---

## Table of contents

1. [Project setup (deps + CSS)](#1-project-setup-deps--css)
2. [Minimal table (local data, no Tailwind preset)](#2-minimal-table-local-data-no-tailwind-preset)
3. [Tailwind preset + base layout CSS](#3-tailwind-preset--base-layout-css)
4. [Column definitions: sort, filter, `format`, `render`, `exportable`](#4-column-definitions-sort-filter-format-render-exportable)
5. [Custom cells + `formatDisplayValue` + custom card](#5-custom-cells--formatdisplayvalue--custom-card)
6. [Tailwind slot map (`classNames`)](#6-tailwind-slot-map-classnames)
7. [App state + `SmartTable` (server, search, export, cards, …)](#7-app-state--smarttable-server-search-export-cards-)
8. [More API surface (not used in the demo)](#8-more-api-surface-not-used-in-the-demo)
9. [Full `App.jsx` (single file, copy-paste)](#9-full-appjsx-single-file-copy-paste)

---

## 1. Project setup (deps + CSS)

**`package.json` dependency** (workspace / local pack works the same):

```json
{
  "dependencies": {
    "table-for-react": "file:../packages/table-for-react",
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x"
  }
}
```

**`src/index.css`** — Tailwind v4, library base CSS (needed for card layout / semantic hooks), and `@source` so classes inside the library preset are not purged:

```css
@import "tailwindcss";
@import "../../packages/table-for-react/styles/base.css";
@source "../../packages/table-for-react/src/**/*.{js,jsx}";
```

**`src/main.jsx`** (typical Vite + React):

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## 2. Minimal table (local data, no Tailwind preset)

Uses **`appearance="minimal"`** and semantic classes from `base.css`. Good when you do not want the bundled Tailwind string map.

```jsx
import { SmartTable } from "table-for-react";
import "table-for-react/base.css";

const columns = [
  { key: "name", label: "Name", sort: true },
  { key: "city", label: "City" },
];

const data = [
  { id: 1, name: "Ada", city: "London" },
  { id: 2, name: "Bob", city: "Paris" },
];

export default function MinimalTableDemo() {
  return (
    <div className="p-6">
      <SmartTable
        appearance="minimal"
        columns={columns}
        data={data}
        enablePagination
        pageSize={5}
      />
    </div>
  );
}
```

---

## 3. Tailwind preset + base layout CSS

The demo uses **`appearance="tailwind"`** and passes a large **`classNames`** object (see [§6](#6-tailwind-slot-map-classnames)). With Tailwind, still import **`table-for-react/base.css`** (via `index.css` above) so **card grid/list** layout uses the semantic hooks the preset relies on.

```jsx
import { SmartTable } from "table-for-react";
// index.css should @import base.css (see §1)

<SmartTable appearance="tailwind" classNames={tableClassNames} columns={columns} data={rows} />
```

---

## 4. Column definitions: sort, filter, `format`, `render`, `exportable`

- **`sort: true`** — column participates in sorting (unless overridden by `sortAll`).
- **`filter: "text"` | `"select"`** — column filter UI (table view only; see `enableColumnFilters`).
- **`format`** — declarative formatting (uses `formatDisplayValue` internally for cells).
- **`render: (row) => …`** — fully custom cell UI.
- **`exportable: false`** — omit from CSV (e.g. Actions column with a synthetic `key`).

```js
const columns = [
  {
    key: "name",
    label: "Name",
    sort: true,
    filter: "text",
    render: (row) => <NameCell row={row} />,
  },
  {
    key: "city",
    label: "City",
    sort: true,
    filter: "select",
    render: (row) => <CityCell row={row} />,
  },
  {
    key: "role",
    label: "Role",
    filter: "text",
    render: (row) => <RoleCell row={row} />,
  },
  {
    key: "status",
    label: "Status",
    filter: "select",
    render: (row) => <StatusCell row={row} />,
  },
  {
    key: "score",
    label: "Score",
    sort: true,
    render: (row) => <ScoreCell row={row} />,
  },
  {
    key: "salaryAnnual",
    label: "Salary",
    sort: true,
    format: {
      type: "currency",
      currency: "USD",
      currencyDisplay: "symbol",
      maximumFractionDigits: 0,
    },
  },
  {
    key: "attainmentRatio",
    label: "Quota",
    sort: true,
    format: {
      type: "percentage",
      valueScale: "ratio",
      maximumFractionDigits: 1,
    },
  },
  {
    key: "feeRatePercent",
    label: "Fee rate",
    sort: true,
    format: {
      type: "percentage",
      valueScale: "percent",
      maximumFractionDigits: 2,
    },
  },
  {
    key: "__actions",
    label: "Actions",
    exportable: false,
    render: (row) => <ActionsCell row={row} />,
  },
];
```

---

## 5. Custom cells + `formatDisplayValue` + custom card

Everything below is **demo UI only** — it shows how `render`, `cardRenderer`, and `formatDisplayValue` compose. Paste below your imports (`React`, `useState`, `SmartTable`, `formatDisplayValue`).

```jsx
/** Metro cities → small badge + label (conditional UI example). */
const METRO_HINT = new Set([
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
]);

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-900 ring-amber-600/20",
  Disabled: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

function NameCell({ row }) {
  const initial = row.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const showLimited = row.status === "Disabled";

  return (
    <div className="flex min-w-[11rem] max-w-[220px] items-center gap-3">
      {row.avatar ? (
        <img
          src={row.avatar}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-[13px] font-semibold text-indigo-800"
        >
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{row.name}</p>
        {showLimited ? (
          <p className="text-[11px] font-medium text-amber-800">Limited access</p>
        ) : row.status === "Pending" ? (
          <p className="text-[11px] text-slate-500">Profile pending sync</p>
        ) : null}
      </div>
    </div>
  );
}

function CityCell({ row }) {
  const isMetro = METRO_HINT.has(row.city);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{row.city}</span>
      {isMetro ? (
        <span className="rounded-md bg-indigo-50 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-200/80">
          Metro
        </span>
      ) : (
        <span className="text-[10px] text-slate-400">Regional</span>
      )}
    </div>
  );
}

function RoleCell({ row }) {
  const emphasize = row.status === "Pending";
  const highlightRole = ["Product Manager", "Developer"].includes(row.role);

  return (
    <span
      className={`${emphasize ? "italic text-amber-900/85" : "text-slate-600"} ${highlightRole ? "font-medium text-slate-800" : ""}`}
      title={
        emphasize
          ? "Role may change after approval"
          : undefined
      }
    >
      {row.role}
    </span>
  );
}

function StatusCell({ row }) {
  const chip =
    STATUS_STYLES[row.status] ??
    "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <div className="flex min-w-[7.5rem] flex-col gap-1">
      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${chip}`}
      >
        {row.status}
      </span>
      {row.status === "Pending" && (
        <span className="text-[10px] leading-tight text-slate-500">
          Awaiting review
        </span>
      )}
      {row.status === "Disabled" && (
        <span className="text-[10px] leading-tight text-slate-500">
          Hidden from roster tools
        </span>
      )}
    </div>
  );
}

/**
 * Columns that exist only in the UI: pick any `key` not returned by the API,
 * supply `render`, leave `sort` off (unless you derive a sort value), and set
 * `exportable: false` to omit from CSV exports.
 */
function ActionsCell({ row }) {
  return (
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        onClick={() => {
          console.info("[demo] View", row);
          alert(`View: ${row.name} (id ${row.id})`);
        }}
      >
        View
      </button>
      <button
        type="button"
        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
        onClick={() => {
          console.info("[demo] Edit", row);
          alert(`Edit: ${row.name} — wire this to routing or a drawer.`);
        }}
      >
        Edit
      </button>
    </div>
  );
}

function ScoreCell({ row, compact = false }) {
  const score = Number(row.score);
  const safe = Number.isFinite(score) ? score : 0;
  const pct = Math.min(100, Math.max(0, safe));

  let barTone = "bg-emerald-500";
  let labelTone = "text-slate-800";
  if (safe < 70) {
    barTone = "bg-rose-500";
    labelTone = "text-rose-950";
  } else if (safe < 86) {
    barTone = "bg-amber-500";
    labelTone = "text-amber-950";
  }

  const showCongrats = safe >= 90;

  if (compact) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`min-w-0 truncate tabular-nums text-[15px] font-semibold leading-none sm:text-base ${labelTone}`}
          >
            {safe}
          </span>
          {showCongrats ? (
            <span
              className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800"
              title="Top performer"
            >
              Top
            </span>
          ) : null}
        </div>
        <div className="h-1 w-full min-w-0 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${barTone}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-[7rem] flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`tabular-nums text-sm font-semibold ${labelTone}`}>
          {safe}
        </span>
        {showCongrats ? (
          <span
            className="rounded-full bg-emerald-100 px-2 py-0 text-[10px] font-semibold text-emerald-800"
            title="Top performer"
          >
            Top tier
          </span>
        ) : null}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barTone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Shared metric shell: `min-w-0` + overflow safety for grid children. */
function MetricTile({ label, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100/90 bg-white/95 p-3 shadow-sm ring-1 ring-slate-100/90">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="mt-2 min-w-0">{children}</div>
    </div>
  );
}

/** Card-view layout: richer than repeating table cells; mirrors data + Actions. */
function DemoMemberCard({ row, isSelected, toggleSelect }) {
  const initial = row.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const chip =
    STATUS_STYLES[row.status] ??
    "bg-slate-50 text-slate-700 ring-slate-200";

  const salary = formatDisplayValue(row.salaryAnnual, {
    type: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  });
  const quota = formatDisplayValue(row.attainmentRatio, {
    type: "percentage",
    valueScale: "ratio",
    maximumFractionDigits: 1,
  });
  const feeRate = formatDisplayValue(row.feeRatePercent, {
    type: "percentage",
    valueScale: "percent",
    maximumFractionDigits: 2,
  });

  return (
    <article
      className={`relative isolate overflow-hidden rounded-2xl border bg-white shadow-[0_12px_40px_-14px_rgba(15,23,42,0.18)] transition-all duration-200 ${
        isSelected
          ? "border-indigo-300 shadow-indigo-500/15 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50"
          : "border-slate-200/90 hover:border-slate-300/90 hover:shadow-[0_16px_48px_-14px_rgba(15,23,42,0.22)]"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent"
      />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-50/90 to-transparent opacity-95" />

      <label className="absolute right-4 top-4 z-10 flex cursor-pointer items-center rounded-lg border border-white/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={toggleSelect}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/40"
          aria-label={`Select ${row.name ?? "row"}`}
        />
      </label>

      <div className="relative px-5 pb-5 pt-6">
        <div className="flex gap-4 pr-14">
          {row.avatar ? (
            <img
              src={row.avatar}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-md shadow-slate-900/15 ring-2 ring-white"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-lg font-bold text-white shadow-md shadow-indigo-900/25">
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <div>
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600/85">
                  Team member #{row.id}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  {row.name}
                </h3>
                <p className="mt-0.5 truncate text-[14px] text-slate-600">
                  <RoleCell row={row} />
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${chip}`}
              >
                {row.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100/90 pt-4">
              <div className="flex items-center gap-2 text-[13px] text-slate-700">
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7.5-4.35-7.5-10a7.5 7.5 0 0115 0c0 5.65-7.5 10-7.5 10z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                </span>
                <CityCell row={row} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Score">
            <ScoreCell row={row} compact />
          </MetricTile>
          <MetricTile label="Salary">
            <p
              className="mt-0.5 break-words tabular-nums text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:text-[0.9375rem]"
              title={String(salary)}
            >
              {salary}
            </p>
          </MetricTile>
          <MetricTile label="Quota">
            <p
              className="mt-0.5 break-words tabular-nums text-sm font-semibold leading-snug tracking-tight text-indigo-700 sm:text-[0.9375rem]"
              title={String(quota)}
            >
              {quota}
            </p>
          </MetricTile>
          <MetricTile label="Fee rate">
            <p
              className="mt-0.5 break-words tabular-nums text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:text-[0.9375rem]"
              title={String(feeRate)}
            >
              {feeRate}
            </p>
          </MetricTile>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
          <ActionsCell row={row} />
        </div>
      </div>
    </article>
  );
}
```

---

## 6. Tailwind slot map (`classNames`)

The demo replaces almost every visual slot. **`cardGrid` / `cardItem` / …** pair with semantic classes from `base.css` (`smart-table__card-grid`, …) so **Tailwind + cards** stay responsive.

```js
const tableClassNames = {
  root:
    "w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.08)]",
  toolbar:
    "sticky top-0 z-10 border-b border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-50/95 backdrop-blur-sm",
  toolbarInner: "flex flex-wrap items-center justify-end gap-2.5 px-4 py-3.5",

  columnsMenuWrapper: "relative",
  columnsTrigger:
    "rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
  columnsMenu:
    "absolute right-0 z-50 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/10",
  columnsMenuItem:
    "flex cursor-pointer items-center gap-2.5 rounded-md py-2 px-1.5 text-[13px] text-slate-700 hover:bg-slate-50",

  showSelectedToggle: "mr-1 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-600",
  showSelectedCheckbox: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40",

  exportSecondaryButton:
    "rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40",
  exportPrimaryButton:
    "rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50",

  searchInput:
    "order-first w-full max-w-[18rem] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/25 sm:order-none sm:w-72",

  body: "p-4 sm:p-5",

  loading: "py-16 text-[15px] font-medium tracking-tight text-slate-500",

  tableWrap: "overflow-x-auto",
  table: "w-full border-collapse text-[13px]",
  thead: "bg-slate-100/95",
  theadRow: "",
  thSelect:
    "w-12 border-b border-slate-200 px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500",
  th:
    "border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600",
  thInner: "flex items-center justify-between gap-3",
  thSortLabel:
    "inline-flex select-none items-center gap-1 rounded-md text-left text-[11px] font-semibold uppercase tracking-wider text-slate-700 transition hover:text-indigo-700",
  thSortLabelInactive:
    "cursor-default text-slate-600 hover:text-slate-600",
  thSortLabelText: "inline",
  thSortArrows:
    "-mr-1 inline-flex flex-col gap-px text-[9px] leading-none opacity-95",
  thSortArrow: "block leading-none",
  thSortArrowActive: "font-bold text-indigo-600",
  thSortArrowInactive: "font-normal text-slate-300",
  filterToggle:
    "shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700",
  filterToggleActive:
    "text-indigo-600 ring-1 ring-indigo-200/80 ring-offset-1 ring-offset-white",
  thRelative: "relative align-top",
  filterPanel:
    "absolute left-0 right-0 z-50 mt-1 max-h-52 max-w-none overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-3 text-start shadow-xl shadow-slate-900/15 sm:left-auto sm:min-w-[13rem]",
  filterPanelHeader:
    "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500",
  filterOptionRow:
    "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-slate-800 hover:bg-slate-50",
  filterTextInput:
    "mb-3 box-border w-full min-w-[10rem] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20",
  filterClearBtn:
    "mt-1 p-0 text-[10px] font-bold uppercase tracking-wider text-indigo-600 underline-offset-2 hover:underline",
  filterEmptyHint: "text-xs text-slate-500",

  tbody: "divide-y divide-slate-100",
  tr: "bg-white transition hover:bg-slate-50/80",
  td: "border-none px-4 py-3.5 align-middle text-slate-700",
  tdSelect: "border-none px-4 py-3 text-center align-middle",

  checkbox:
    "h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40",

  pagination:
    "flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200/90 bg-slate-50/50 px-5 py-4",
  paginationPageSizeWrap: "flex items-center gap-2",
  paginationPageSizeLabel: "text-[12px] font-medium text-slate-600",
  pageSizeSelect:
    "cursor-pointer rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-10 text-[13px] font-medium text-slate-800 shadow-sm outline-none hover:border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/25",
  paginationNav:
    "flex flex-wrap items-center justify-end gap-4 sm:ms-auto",
  paginationInfo: "text-[13px] font-medium tabular-nums text-slate-600",
  pageButton:
    "min-w-[5.25rem] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400",

  /* Card layout uses semantic classes from table-for-react/base.css (imported in index.css). */
  cardGrid: "smart-table__card-grid",
  cardGrid_list: "smart-table__card-grid--list",
  cardItem: "smart-table__card-item",
  cardFields: "smart-table__card-fields",
  cardField: "smart-table__card-field",
  card:
    "smart-table__card rounded-2xl border border-slate-200/90 bg-white p-5 pt-7 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-slate-300/90 hover:shadow-md",
  card_selected:
    "ring-2 ring-indigo-400 ring-offset-2 ring-offset-white",
  cardSelectCheckbox:
    "absolute right-3 top-3 h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40",
  cardLabel:
    "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400",
  cardValue: "text-[13px] font-medium leading-snug text-slate-800",
  cardExpandToggle: "mt-3 text-[12px] font-semibold text-indigo-600 hover:underline",
  cardDetails: "mt-2 text-[13px] text-slate-600",
  cardJson:
    "mt-2 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/90 p-3 text-[11px] leading-relaxed text-slate-800",
};
```

---

## 7. App state + `SmartTable` (server, search, export, cards, …)

**State the demo drives from the shell:**

- **`viewMode`**: `"table"` | `"card"`.
- **`cardLayout`**: `"grid"` | `"list"` (only relevant in card view).
- **`pageSize`** + **`onPageSizeChange`**: controlled page size; **`pageSizeOptions`** fills the footer select.

**`SmartTable` props used:**

| Prop | Role |
|------|------|
| `enableServerData` + `serverConfig` | Fetch pages from an API (`GET` + query params). |
| `enableColumnFilters` | Per-column filters (subset of **current loaded rows** / current server page). |
| `enableSearch` | Toolbar search; with `searchParam` in `serverConfig`, sent to server. |
| `enablePagination` | Pager UI. |
| `enableExport` / `enableExportSelected` | CSV export. |
| `enableCardSelection` | Selection in card view (pairs with `cardRenderer`). |
| `enableColumnVisibility` | Columns menu in toolbar. |
| `viewMode` / `cardLayout` / `cardRenderer` | Card presentation. |

This block assumes **§5** (cells + `DemoMemberCard`) and **§6** (`tableClassNames`) are in scope.

```jsx
import React, { useState } from "react";
import { SmartTable } from "table-for-react";

export default function App() {
  const [viewMode, setViewMode] = useState("table");
  const [cardLayout, setCardLayout] = useState("grid");
  const [pageSize, setPageSize] = useState(5);

  const columns = [
    {
      key: "name",
      label: "Name",
      sort: true,
      filter: "text",
      render: (row) => <NameCell row={row} />,
    },
    {
      key: "city",
      label: "City",
      sort: true,
      filter: "select",
      render: (row) => <CityCell row={row} />,
    },
    {
      key: "role",
      label: "Role",
      filter: "text",
      render: (row) => <RoleCell row={row} />,
    },
    {
      key: "status",
      label: "Status",
      filter: "select",
      render: (row) => <StatusCell row={row} />,
    },
    {
      key: "score",
      label: "Score",
      sort: true,
      render: (row) => <ScoreCell row={row} />,
    },
    {
      key: "salaryAnnual",
      label: "Salary",
      sort: true,
      format: {
        type: "currency",
        currency: "USD",
        currencyDisplay: "symbol",
        maximumFractionDigits: 0,
      },
    },
    {
      key: "attainmentRatio",
      label: "Quota",
      sort: true,
      format: {
        type: "percentage",
        valueScale: "ratio",
        maximumFractionDigits: 1,
      },
    },
    {
      key: "feeRatePercent",
      label: "Fee rate",
      sort: true,
      format: {
        type: "percentage",
        valueScale: "percent",
        maximumFractionDigits: 2,
      },
    },
    {
      key: "__actions",
      label: "Actions",
      exportable: false,
      render: (row) => <ActionsCell row={row} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/80">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Workspace
          </p>
          <h1 className="text-balance font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Team directory
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Custom cells use{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px] text-slate-800">render</code>{" "}
            (table cells below). Pure UI columns—like{" "}
            <span className="font-medium text-slate-700">Actions</span>—use any{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">key</code> not returned by your API plus{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">exportable: false</code>{" "}
            so CSV skips them. <span className="font-medium text-slate-700">Card view</span> uses{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">cardRenderer</code>.{" "}
            <span className="font-medium text-slate-700">Column filters</span> use{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">column.filter</code>{" "}
            (table only) and subset the rows already loaded in the UI—including one server page at a time when using the API demo. Use the footer rows-per-page control to change how many records each request loads.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
              View
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/90 p-0.5 shadow-sm">
              {[
                ["table", "Table"],
                ["card", "Cards"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                    viewMode === id
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-pressed={viewMode === id}
                  onClick={() => setViewMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
                Card layout
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/90 p-0.5 shadow-sm">
                {[
                  ["grid", "Grid"],
                  ["list", "List"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                      cardLayout === id
                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-pressed={cardLayout === id}
                    onClick={() => setCardLayout(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <SmartTable
          appearance="tailwind"
          classNames={tableClassNames}
          columns={columns}
          enablePagination
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 15, 25, 50]}
          enableServerData={true}
          serverConfig={{
            method: "GET",
            url: "http://localhost:3000/users",
            pageParam: "page",
            limitParam: "limit",
            searchParam: "q",
            dataPath: "data",
            totalPath: "total",
            defaultParams: {},
          }}
          enableColumnFilters
          viewMode={viewMode}
          cardLayout={cardLayout}
          cardRenderer={(row, isSelected, toggleSelect) => (
            <DemoMemberCard
              row={row}
              isSelected={isSelected}
              toggleSelect={toggleSelect}
            />
          )}
          enableSearch
          enableExport
          enableExportSelected
          enableCardSelection
          enableColumnVisibility
        />
      </div>
    </div>
  );
}
```

> **Note:** For one file without forward references, use [§9](#9-full-appjsx-single-file-copy-paste) (matches `src/App.jsx` exactly).

---

## 8. More API surface (not used in the demo)

### `tailwindClassNames` + `composeClassNames` / `appendClassNames`

Start from the bundled preset and override or append:

```jsx
import {
  SmartTable,
  tailwindClassNames,
  composeClassNames,
} from "table-for-react";

const classNames = composeClassNames(tailwindClassNames, {
  root: "max-w-4xl mx-auto",
});

<SmartTable appearance="tailwind" classNames={classNames} columns={cols} data={rows} />;
```

```jsx
<SmartTable
  appearance="tailwind"
  classNames={tailwindClassNames}
  appendClassNames={{ root: "shadow-lg", toolbar: "backdrop-blur" }}
  columns={cols}
  data={rows}
/>
```

### Swappable primitives (e.g. Ant Design)

```jsx
import { SmartTable } from "table-for-react";
import { Button, Input, Checkbox } from "antd";

<SmartTable
  appearance="minimal"
  components={{ Button, Input, Checkbox }}
  columns={cols}
  data={rows}
/>
```

### `sortAll`

When boolean, forces **all** or **no** columns to sort, ignoring per-column `sort`.

```jsx
<SmartTable sortAll={false} columns={cols} data={rows} />
```

### `enableShowSelectedToggle`

When there is a row selection, shows a “selected only” filter in the toolbar.

```jsx
<SmartTable enableShowSelectedToggle columns={cols} data={rows} />
```

### Expandable built-in cards + details

```jsx
<SmartTable
  appearance="tailwind"
  expandableCards
  cardDetailsRenderer={(row) => <pre>{JSON.stringify(row, null, 2)}</pre>}
  columns={cols}
  data={rows}
  viewMode="card"
/>
```

### Custom card grid / item wrappers (`ul` / `li`)

```jsx
<SmartTable
  renderCardGrid={({ children, className }) => (
    <ul className={className}>{children}</ul>
  )}
  renderCardItem={({ children, className, rowKey }) => (
    <li key={rowKey} className={className}>
      {children}
    </li>
  )}
  cardRenderer={(row) => <span>{row.name}</span>}
  columns={cols}
  data={rows}
  viewMode="card"
/>
```

### Column filter helpers (library exports)

```js
import {
  applyColumnFiltersToRows,
  serializeColumnFiltersPayload,
} from "table-for-react";

// Client-side: filter a row array with the same rules as the table UI
const filtered = applyColumnFiltersToRows(rows, specs, filters);

// If you POST filters to your own API
const payload = serializeColumnFiltersPayload(filters, specs);
```

---

## 9. Full `App.jsx` (single file, copy-paste)

This is the **entire** current demo application module — same as [`src/App.jsx`](src/App.jsx).

```jsx
import React, { useState } from "react";
import { SmartTable, formatDisplayValue } from "table-for-react";

/** Metro cities → small badge + label (conditional UI example). */
const METRO_HINT = new Set([
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
]);

const STATUS_STYLES = {
  Active: "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  Pending: "bg-amber-50 text-amber-900 ring-amber-600/20",
  Disabled: "bg-slate-100 text-slate-600 ring-slate-500/15",
};

function NameCell({ row }) {
  const initial = row.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const showLimited = row.status === "Disabled";

  return (
    <div className="flex min-w-[11rem] max-w-[220px] items-center gap-3">
      {row.avatar ? (
        <img
          src={row.avatar}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-[13px] font-semibold text-indigo-800"
        >
          {initial}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{row.name}</p>
        {showLimited ? (
          <p className="text-[11px] font-medium text-amber-800">Limited access</p>
        ) : row.status === "Pending" ? (
          <p className="text-[11px] text-slate-500">Profile pending sync</p>
        ) : null}
      </div>
    </div>
  );
}

function CityCell({ row }) {
  const isMetro = METRO_HINT.has(row.city);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span>{row.city}</span>
      {isMetro ? (
        <span className="rounded-md bg-indigo-50 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-200/80">
          Metro
        </span>
      ) : (
        <span className="text-[10px] text-slate-400">Regional</span>
      )}
    </div>
  );
}

function RoleCell({ row }) {
  const emphasize = row.status === "Pending";
  const highlightRole = ["Product Manager", "Developer"].includes(row.role);

  return (
    <span
      className={`${emphasize ? "italic text-amber-900/85" : "text-slate-600"} ${highlightRole ? "font-medium text-slate-800" : ""}`}
      title={
        emphasize
          ? "Role may change after approval"
          : undefined
      }
    >
      {row.role}
    </span>
  );
}

function StatusCell({ row }) {
  const chip =
    STATUS_STYLES[row.status] ??
    "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <div className="flex min-w-[7.5rem] flex-col gap-1">
      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${chip}`}
      >
        {row.status}
      </span>
      {row.status === "Pending" && (
        <span className="text-[10px] leading-tight text-slate-500">
          Awaiting review
        </span>
      )}
      {row.status === "Disabled" && (
        <span className="text-[10px] leading-tight text-slate-500">
          Hidden from roster tools
        </span>
      )}
    </div>
  );
}

/**
 * Columns that exist only in the UI: pick any `key` not returned by the API,
 * supply `render`, leave `sort` off (unless you derive a sort value), and set
 * `exportable: false` to omit from CSV exports.
 */
function ActionsCell({ row }) {
  return (
    <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5">
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        onClick={() => {
          console.info("[demo] View", row);
          alert(`View: ${row.name} (id ${row.id})`);
        }}
      >
        View
      </button>
      <button
        type="button"
        className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/40"
        onClick={() => {
          console.info("[demo] Edit", row);
          alert(`Edit: ${row.name} — wire this to routing or a drawer.`);
        }}
      >
        Edit
      </button>
    </div>
  );
}

function ScoreCell({ row, compact = false }) {
  const score = Number(row.score);
  const safe = Number.isFinite(score) ? score : 0;
  const pct = Math.min(100, Math.max(0, safe));

  let barTone = "bg-emerald-500";
  let labelTone = "text-slate-800";
  if (safe < 70) {
    barTone = "bg-rose-500";
    labelTone = "text-rose-950";
  } else if (safe < 86) {
    barTone = "bg-amber-500";
    labelTone = "text-amber-950";
  }

  const showCongrats = safe >= 90;

  if (compact) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`min-w-0 truncate tabular-nums text-[15px] font-semibold leading-none sm:text-base ${labelTone}`}
          >
            {safe}
          </span>
          {showCongrats ? (
            <span
              className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-800"
              title="Top performer"
            >
              Top
            </span>
          ) : null}
        </div>
        <div className="h-1 w-full min-w-0 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${barTone}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-[7rem] flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`tabular-nums text-sm font-semibold ${labelTone}`}>
          {safe}
        </span>
        {showCongrats ? (
          <span
            className="rounded-full bg-emerald-100 px-2 py-0 text-[10px] font-semibold text-emerald-800"
            title="Top performer"
          >
            Top tier
          </span>
        ) : null}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${barTone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Shared metric shell: `min-w-0` + overflow safety for grid children. */
function MetricTile({ label, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-100/90 bg-white/95 p-3 shadow-sm ring-1 ring-slate-100/90">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <div className="mt-2 min-w-0">{children}</div>
    </div>
  );
}

/** Card-view layout: richer than repeating table cells; mirrors data + Actions. */
function DemoMemberCard({ row, isSelected, toggleSelect }) {
  const initial = row.name?.trim()?.[0]?.toUpperCase() ?? "?";
  const chip =
    STATUS_STYLES[row.status] ??
    "bg-slate-50 text-slate-700 ring-slate-200";

  const salary = formatDisplayValue(row.salaryAnnual, {
    type: "currency",
    currency: "USD",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  });
  const quota = formatDisplayValue(row.attainmentRatio, {
    type: "percentage",
    valueScale: "ratio",
    maximumFractionDigits: 1,
  });
  const feeRate = formatDisplayValue(row.feeRatePercent, {
    type: "percentage",
    valueScale: "percent",
    maximumFractionDigits: 2,
  });

  return (
    <article
      className={`relative isolate overflow-hidden rounded-2xl border bg-white shadow-[0_12px_40px_-14px_rgba(15,23,42,0.18)] transition-all duration-200 ${
        isSelected
          ? "border-indigo-300 shadow-indigo-500/15 ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-50"
          : "border-slate-200/90 hover:border-slate-300/90 hover:shadow-[0_16px_48px_-14px_rgba(15,23,42,0.22)]"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/80 to-transparent"
      />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-indigo-50/90 to-transparent opacity-95" />

      <label className="absolute right-4 top-4 z-10 flex cursor-pointer items-center rounded-lg border border-white/80 bg-white/90 p-1.5 shadow-sm backdrop-blur-sm">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={toggleSelect}
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/40"
          aria-label={`Select ${row.name ?? "row"}`}
        />
      </label>

      <div className="relative px-5 pb-5 pt-6">
        <div className="flex gap-4 pr-14">
          {row.avatar ? (
            <img
              src={row.avatar}
              alt=""
              className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-md shadow-slate-900/15 ring-2 ring-white"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-lg font-bold text-white shadow-md shadow-indigo-900/25">
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
              <div>
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600/85">
                  Team member #{row.id}
                </p>
                <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                  {row.name}
                </h3>
                <p className="mt-0.5 truncate text-[14px] text-slate-600">
                  <RoleCell row={row} />
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ${chip}`}
              >
                {row.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100/90 pt-4">
              <div className="flex items-center gap-2 text-[13px] text-slate-700">
                <span
                  aria-hidden
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/80"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7.5-4.35-7.5-10a7.5 7.5 0 0115 0c0 5.65-7.5 10-7.5 10z" />
                    <circle cx="12" cy="11" r="2.5" />
                  </svg>
                </span>
                <CityCell row={row} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 xl:grid-cols-4">
          <MetricTile label="Score">
            <ScoreCell row={row} compact />
          </MetricTile>
          <MetricTile label="Salary">
            <p
              className="mt-0.5 break-words tabular-nums text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:text-[0.9375rem]"
              title={String(salary)}
            >
              {salary}
            </p>
          </MetricTile>
          <MetricTile label="Quota">
            <p
              className="mt-0.5 break-words tabular-nums text-sm font-semibold leading-snug tracking-tight text-indigo-700 sm:text-[0.9375rem]"
              title={String(quota)}
            >
              {quota}
            </p>
          </MetricTile>
          <MetricTile label="Fee rate">
            <p
              className="mt-0.5 break-words tabular-nums text-sm font-semibold leading-snug tracking-tight text-slate-900 sm:text-[0.9375rem]"
              title={String(feeRate)}
            >
              {feeRate}
            </p>
          </MetricTile>
        </div>

        <div className="mt-5 flex justify-end border-t border-slate-100 pt-5">
          <ActionsCell row={row} />
        </div>
      </div>
    </article>
  );
}

const tableClassNames = {
  root:
    "w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.08)]",
  toolbar:
    "sticky top-0 z-10 border-b border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-50/95 backdrop-blur-sm",
  toolbarInner: "flex flex-wrap items-center justify-end gap-2.5 px-4 py-3.5",

  columnsMenuWrapper: "relative",
  columnsTrigger:
    "rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
  columnsMenu:
    "absolute right-0 z-50 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/10",
  columnsMenuItem:
    "flex cursor-pointer items-center gap-2.5 rounded-md py-2 px-1.5 text-[13px] text-slate-700 hover:bg-slate-50",

  showSelectedToggle: "mr-1 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-600",
  showSelectedCheckbox: "rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40",

  exportSecondaryButton:
    "rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40",
  exportPrimaryButton:
    "rounded-lg bg-indigo-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50",

  searchInput:
    "order-first w-full max-w-[18rem] rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[13px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/25 sm:order-none sm:w-72",

  body: "p-4 sm:p-5",

  loading: "py-16 text-[15px] font-medium tracking-tight text-slate-500",

  tableWrap: "overflow-x-auto",
  table: "w-full border-collapse text-[13px]",
  thead: "bg-slate-100/95",
  theadRow: "",
  thSelect:
    "w-12 border-b border-slate-200 px-4 py-3.5 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500",
  th:
    "border-b border-slate-200 px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-600",
  thInner: "flex items-center justify-between gap-3",
  thSortLabel:
    "inline-flex select-none items-center gap-1 rounded-md text-left text-[11px] font-semibold uppercase tracking-wider text-slate-700 transition hover:text-indigo-700",
  thSortLabelInactive:
    "cursor-default text-slate-600 hover:text-slate-600",
  thSortLabelText: "inline",
  thSortArrows:
    "-mr-1 inline-flex flex-col gap-px text-[9px] leading-none opacity-95",
  thSortArrow: "block leading-none",
  thSortArrowActive: "font-bold text-indigo-600",
  thSortArrowInactive: "font-normal text-slate-300",
  filterToggle:
    "shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700",
  filterToggleActive:
    "text-indigo-600 ring-1 ring-indigo-200/80 ring-offset-1 ring-offset-white",
  thRelative: "relative align-top",
  filterPanel:
    "absolute left-0 right-0 z-50 mt-1 max-h-52 max-w-none overflow-y-auto rounded-xl border border-slate-200/90 bg-white p-3 text-start shadow-xl shadow-slate-900/15 sm:left-auto sm:min-w-[13rem]",
  filterPanelHeader:
    "mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500",
  filterOptionRow:
    "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-[13px] text-slate-800 hover:bg-slate-50",
  filterTextInput:
    "mb-3 box-border w-full min-w-[10rem] rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[13px] text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20",
  filterClearBtn:
    "mt-1 p-0 text-[10px] font-bold uppercase tracking-wider text-indigo-600 underline-offset-2 hover:underline",
  filterEmptyHint: "text-xs text-slate-500",

  tbody: "divide-y divide-slate-100",
  tr: "bg-white transition hover:bg-slate-50/80",
  td: "border-none px-4 py-3.5 align-middle text-slate-700",
  tdSelect: "border-none px-4 py-3 text-center align-middle",

  checkbox:
    "h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40",

  pagination:
    "flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200/90 bg-slate-50/50 px-5 py-4",
  paginationPageSizeWrap: "flex items-center gap-2",
  paginationPageSizeLabel: "text-[12px] font-medium text-slate-600",
  pageSizeSelect:
    "cursor-pointer rounded-lg border border-slate-200 bg-white py-2 pl-2.5 pr-10 text-[13px] font-medium text-slate-800 shadow-sm outline-none hover:border-slate-300 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/25",
  paginationNav:
    "flex flex-wrap items-center justify-end gap-4 sm:ms-auto",
  paginationInfo: "text-[13px] font-medium tabular-nums text-slate-600",
  pageButton:
    "min-w-[5.25rem] rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400",

  /* Card layout uses semantic classes from table-for-react/base.css (imported in index.css). */
  cardGrid: "smart-table__card-grid",
  cardGrid_list: "smart-table__card-grid--list",
  cardItem: "smart-table__card-item",
  cardFields: "smart-table__card-fields",
  cardField: "smart-table__card-field",
  card:
    "smart-table__card rounded-2xl border border-slate-200/90 bg-white p-5 pt-7 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-slate-300/90 hover:shadow-md",
  card_selected:
    "ring-2 ring-indigo-400 ring-offset-2 ring-offset-white",
  cardSelectCheckbox:
    "absolute right-3 top-3 h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/40",
  cardLabel:
    "mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400",
  cardValue: "text-[13px] font-medium leading-snug text-slate-800",
  cardExpandToggle: "mt-3 text-[12px] font-semibold text-indigo-600 hover:underline",
  cardDetails: "mt-2 text-[13px] text-slate-600",
  cardJson:
    "mt-2 overflow-x-auto rounded-lg border border-slate-100 bg-slate-50/90 p-3 text-[11px] leading-relaxed text-slate-800",
};

/**
 * Columns: use `render: (row) => …` for custom UI (see cells above).
 * API-only extras: arbitrary `key` + `render` + `exportable: false`; no field from server required.
 */
export default function App() {
  const [viewMode, setViewMode] = useState("table");
  const [cardLayout, setCardLayout] = useState("grid");
  const [pageSize, setPageSize] = useState(5);

  const columns = [
    {
      key: "name",
      label: "Name",
      sort: true,
      filter: "text",
      render: (row) => <NameCell row={row} />,
    },
    {
      key: "city",
      label: "City",
      sort: true,
      filter: "select",
      render: (row) => <CityCell row={row} />,
    },
    {
      key: "role",
      label: "Role",
      filter: "text",
      render: (row) => <RoleCell row={row} />,
    },
    {
      key: "status",
      label: "Status",
      filter: "select",
      render: (row) => <StatusCell row={row} />,
    },
    {
      key: "score",
      label: "Score",
      sort: true,
      render: (row) => <ScoreCell row={row} />,
    },
    {
      key: "salaryAnnual",
      label: "Salary",
      sort: true,
      format: {
        type: "currency",
        currency: "USD",
        currencyDisplay: "symbol",
        maximumFractionDigits: 0,
      },
    },
    {
      key: "attainmentRatio",
      label: "Quota",
      sort: true,
      format: {
        type: "percentage",
        valueScale: "ratio",
        maximumFractionDigits: 1,
      },
    },
    {
      key: "feeRatePercent",
      label: "Fee rate",
      sort: true,
      format: {
        type: "percentage",
        valueScale: "percent",
        maximumFractionDigits: 2,
      },
    },
    {
      key: "__actions",
      label: "Actions",
      exportable: false,
      render: (row) => <ActionsCell row={row} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/80">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-600">
            Workspace
          </p>
          <h1 className="text-balance font-display text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Team directory
          </h1>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-600">
            Custom cells use{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px] text-slate-800">render</code>{" "}
            (table cells below). Pure UI columns—like{" "}
            <span className="font-medium text-slate-700">Actions</span>—use any{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">key</code> not returned by your API plus{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">exportable: false</code>{" "}
            so CSV skips them. <span className="font-medium text-slate-700">Card view</span> uses{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">cardRenderer</code>.{" "}
            <span className="font-medium text-slate-700">Column filters</span> use{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-[13px]">column.filter</code>{" "}
            (table only) and subset the rows already loaded in the UI—including one server page at a time when using the API demo. Use the footer rows-per-page control to change how many records each request loads.
          </p>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-end gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
              View
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/90 p-0.5 shadow-sm">
              {[
                ["table", "Table"],
                ["card", "Cards"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                    viewMode === id
                      ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  aria-pressed={viewMode === id}
                  onClick={() => setViewMode(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
                Card layout
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/90 p-0.5 shadow-sm">
                {[
                  ["grid", "Grid"],
                  ["list", "List"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${
                      cardLayout === id
                        ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    aria-pressed={cardLayout === id}
                    onClick={() => setCardLayout(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <SmartTable
          appearance="tailwind"
          classNames={tableClassNames}
          columns={columns}
          enablePagination
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10, 15, 25, 50]}
          enableServerData={true}
          serverConfig={{
            method: "GET",
            url: "http://localhost:3000/users",
            pageParam: "page",
            limitParam: "limit",
            searchParam: "q",
            dataPath: "data",
            totalPath: "total",
            defaultParams: {},
          }}
          enableColumnFilters
          viewMode={viewMode}
          cardLayout={cardLayout}
          cardRenderer={(row, isSelected, toggleSelect) => (
            <DemoMemberCard
              row={row}
              isSelected={isSelected}
              toggleSelect={toggleSelect}
            />
          )}
          enableSearch
          enableExport
          enableExportSelected
          enableCardSelection
          enableColumnVisibility
        />
      </div>
    </div>
  );
}
```
