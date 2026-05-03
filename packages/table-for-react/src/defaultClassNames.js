/**
 * Semantic BEM-ish hooks — plain CSS targeting, no Tailwind assumed.
 */
export const defaultClassNames = {
  root: "smart-table",

  toolbar: "smart-table__toolbar",
  toolbarInner: "smart-table__toolbar-inner",

  columnsMenuWrapper: "smart-table__columns-wrap",
  columnsTrigger: "smart-table__columns-trigger",
  columnsMenu: "smart-table__columns-dropdown",
  columnsMenuItem: "smart-table__columns-item",

  showSelectedToggle: "smart-table__show-selected-label",
  showSelectedCheckbox: "smart-table__show-selected-input",

  exportSecondaryButton: "smart-table__btn smart-table__btn--secondary",
  exportPrimaryButton: "smart-table__btn smart-table__btn--primary",

  searchInput: "smart-table__search",

  body: "smart-table__body",

  loading: "smart-table__loading",

  tableWrap: "smart-table__table-wrap",
  table: "smart-table__table",
  thead: "smart-table__thead",
  theadRow: "smart-table__thead-row",
  thSelect: "smart-table__th smart-table__th--select",
  th: "smart-table__th",
  thInner: "smart-table__th-inner",
  thSortLabel: "smart-table__th-sort-label",
  thSortLabelInactive: "",
  thSortLabelText: "smart-table__th-sort-label-text",
  thSortArrows: "smart-table__th-sort-arrows",
  thSortArrow: "smart-table__th-sort-arrow",
  thSortArrowActive: "smart-table__th-sort-arrow--active",
  thSortArrowInactive: "smart-table__th-sort-arrow--inactive",
  filterToggle: "smart-table__filter-toggle",
  filterToggleActive: "smart-table__filter-toggle--active",
  thRelative: "smart-table__th--filter-host",
  filterPanel: "smart-table__filter-panel",
  filterPanelHeader: "smart-table__filter-panel-header",
  filterOptionRow: "smart-table__filter-option",
  filterTextInput:
    "smart-table__filter-text-input smart-table__search smart-table__search--filter",
  filterClearBtn: "smart-table__filter-clear",
  filterEmptyHint: "smart-table__filter-empty",
  tbody: "smart-table__tbody",
  tr: "smart-table__tr",
  td: "smart-table__td",
  tdSelect: "smart-table__td smart-table__td--select",

  checkbox: "smart-table__checkbox",

  pagination: "smart-table__pagination",
  paginationPageSizeWrap: "smart-table__pagination-page-size",
  paginationPageSizeLabel: "smart-table__pagination-page-size-label",
  pageSizeSelect: "smart-table__page-size-select",
  paginationNav: "smart-table__pagination-nav",
  paginationInfo: "smart-table__pagination-info",
  pageButton: "smart-table__page-btn",

  cardGrid: "smart-table__card-grid",
  /** Applied with `cardLayout="list"` (see SmartTable props). */
  cardGrid_list: "smart-table__card-grid--list",
  /** One wrapper per card so grid/flex children get `min-width: 0`. */
  cardItem: "smart-table__card-item",
  /** Wraps labeled fields inside the default card layout. */
  cardFields: "smart-table__card-fields",
  card: "smart-table__card",
  card_selected: "smart-table__card--selected",
  cardSelectCheckbox: "smart-table__card-checkbox",
  cardField: "smart-table__card-field",
  cardLabel: "smart-table__card-label",
  cardValue: "smart-table__card-value",
  cardExpandToggle: "smart-table__card-expand",
  cardDetails: "smart-table__card-details",
  cardJson: "smart-table__card-json",
};
