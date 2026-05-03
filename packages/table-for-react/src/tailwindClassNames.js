/** Optional preset: Tailwind utility strings (~previous default look). */
export const tailwindClassNames = {
  root: "w-full rounded-xl border border-neutral-200 bg-white p-0 shadow-sm",

  toolbar: "sticky top-0 z-20 border-b border-neutral-200 bg-white py-3",
  toolbarInner: "flex flex-wrap items-center justify-end gap-2 px-4",

  columnsMenuWrapper: "relative",
  columnsTrigger: "rounded border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50",
  columnsMenu:
    "absolute right-0 z-50 mt-2 max-h-64 w-56 overflow-y-auto rounded border border-neutral-200 bg-white p-2 shadow-lg",
  columnsMenuItem: "flex cursor-pointer items-center gap-2 py-1 text-sm",

  showSelectedToggle: "mr-2 flex items-center gap-2 text-sm",
  showSelectedCheckbox: "",

  exportSecondaryButton:
    "rounded bg-neutral-700 px-3 py-2 text-sm text-white hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-40",
  exportPrimaryButton:
    "rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700",

  searchInput:
    "w-full max-w-md rounded-lg border border-neutral-200 px-3 py-2 text-sm sm:w-72",

  body: "p-4",

  loading: "p-10 text-center font-medium text-neutral-600",

  tableWrap: "overflow-x-auto",
  table: "w-full border-collapse text-sm",
  thead: "bg-neutral-100 text-xs uppercase text-neutral-700",
  theadRow: "",
  thSelect: "w-10 border border-neutral-200 px-4 py-2 text-center",
  th: "relative border border-neutral-200 px-4 py-3 font-semibold",
  thInner: "flex items-center justify-between gap-2",
  thSortLabel: "inline-flex cursor-pointer select-none items-center gap-1",
  thSortLabelInactive: "cursor-default",
  thSortLabelText: "inline",
  thSortArrows:
    "ml-0.5 inline-flex flex-col items-center gap-px text-[10px] leading-none",
  thSortArrow: "block leading-none",
  thSortArrowActive: "font-bold text-blue-600",
  thSortArrowInactive: "font-normal text-neutral-400 opacity-70",
  filterToggle:
    "shrink-0 cursor-pointer rounded p-0.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900",
  filterToggleActive:
    "text-blue-700 ring-1 ring-blue-200/70 ring-offset-1 ring-offset-transparent",
  thRelative: "relative align-top",
  filterPanel:
    "absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-3 text-start shadow-xl shadow-neutral-950/15 sm:left-auto sm:min-w-[12rem]",
  filterPanelHeader:
    "mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600",
  filterOptionRow:
    "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50",
  filterTextInput:
    "box-border mb-2 w-full min-w-[10rem] rounded-md border border-neutral-200 px-2 py-1.5 text-sm",
  filterClearBtn:
    "text-[11px] font-semibold uppercase tracking-wide text-blue-700 hover:underline",
  filterEmptyHint: "mx-0 my-1 text-xs text-neutral-500",
  tbody: "",
  tr: "odd:bg-neutral-50 hover:bg-neutral-100",
  td: "border border-neutral-200 px-4 py-3",
  tdSelect: "border border-neutral-200 px-4 py-2 text-center",

  checkbox: "h-4 w-4 cursor-pointer",

  pagination:
    "mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-sm",
  paginationPageSizeWrap: "flex shrink-0 items-center gap-2",
  paginationPageSizeLabel:
    "whitespace-nowrap text-[13px] text-neutral-600",
  pageSizeSelect:
    "cursor-pointer rounded-md border border-neutral-200 bg-white py-1.5 pl-2 pr-8 text-[13px] text-neutral-800 shadow-sm outline-none hover:bg-neutral-50 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/40",
  paginationNav:
    "ms-auto flex flex-wrap items-center justify-end gap-x-6 gap-y-2",
  paginationInfo: "",
  pageButton:
    "rounded border border-neutral-200 px-3 py-1 hover:bg-neutral-50 disabled:pointer-events-none disabled:opacity-40",

  /** Layout tokens live in `base.css`; import `table-for-react/base.css` when using Tailwind. */
  cardGrid: "smart-table__card-grid",
  cardGrid_list: "smart-table__card-grid--list",
  cardItem: "smart-table__card-item",
  cardFields: "smart-table__card-fields",
  card: "relative rounded-lg border border-neutral-200 bg-white p-4 pt-6 shadow-sm transition hover:shadow-md",
  card_selected: "ring-2 ring-blue-500",
  cardSelectCheckbox: "absolute right-2 top-2 h-4 w-4 cursor-pointer",
  cardField: "smart-table__card-field",
  cardLabel: "text-xs uppercase text-neutral-500",
  cardValue: "text-sm font-medium",
  cardExpandToggle: "mt-2 text-xs text-blue-600 hover:underline",
  cardDetails: "mt-2 text-sm text-neutral-700",
  cardJson:
    "overflow-x-auto rounded bg-neutral-50 p-2 text-xs text-neutral-800",
};
