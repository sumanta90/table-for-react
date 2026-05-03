import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  appendSlots,
  cx,
  mergeSlots,
} from "./mergeSlots.js";
import { defaultClassNames } from "./defaultClassNames.js";
import { tailwindClassNames } from "./tailwindClassNames.js";
import {
  defaultButton,
  defaultCheckbox,
  defaultInput,
} from "./defaultComponents.jsx";
import { formatDisplayValue } from "./formatValue.js";
import {
  applyColumnFiltersToRows,
  serializeColumnFiltersPayload,
} from "./columnFilters.js";

const EMPTY_ARRAY = [];

function stableRowKey(row, idx) {
  if (row && typeof row === "object") {
    if (row.id != null) return `id:${row.id}`;
    if (row.uuid != null) return `uuid:${row.uuid}`;
    if (row.key != null) return `key:${row.key}`;
  }
  return `idx:${idx}`;
}

const DEFAULT_SERVER_CONFIG = {
  method: "GET",
  url: "",
  pageParam: "page",
  limitParam: "limit",
  /** Set to e.g. `"q"` to send `enableSearch` text to the server (GET query / POST JSON). Omit for client-only search over the loaded slice. */
  searchParam: undefined,
  dataPath: "data",
  totalPath: "total",
  defaultParams: {},
};

/**
 * @typedef {'minimal' | 'tailwind'} SmartTableAppearance
 */

export default function SmartTable({
  columns = EMPTY_ARRAY,
  data = EMPTY_ARRAY,
  sortColumns = [],
  /** When `true`, all columns sort; when `false`, none. Ignores `column.sort` when this is a boolean. */
  sortAll,
  filterColumns = [],
  /** When `true`, uses `column.filter` on each definition and legacy `filterColumns` for `select`; UI + predicates run only when `viewMode !== "card"`. */
  enableColumnFilters = false,
  enableSearch = false,
  enablePagination = false,
  enableExport = false,
  enableExportSelected = false,
  enableCardSelection = false,
  paginationType: _paginationType = "local",
  pageSize = 10,
  /** When set with **`onPageSizeChange`**, a rows-per-page control is shown in the pager. Parent should update **`pageSize`** from the callback. */
  pageSizeOptions = null,
  /** @param {number} next */
  onPageSizeChange,

  viewMode = "table",
  /** `'grid'` = responsive CSS grid · `'list'` = full-width column (flex stack). */
  cardLayout = "grid",
  cardRenderer = null,
  /**
   * Replace the outer card container (default: `cardGrid` slot on a `div`).
   * Use for custom grids, masonry wrappers, `ul`, flex rows, etc.
   * @param {object} opts
   * @param {import('react').ReactNode} opts.children — card items (each wrapped per `renderCardItem` / default)
   * @param {string} opts.className — merged `cardGrid` classes (includes list modifier when `cardLayout="list"`)
   * @param {'grid' | 'list'} opts.layout — resolved `cardLayout`
   */
  renderCardGrid = null,
  /**
   * Replace the per-card wrapper (default: `cardItem` slot on a `div`).
   * Pair with `renderCardGrid` for semantic lists (`ul` / `li`) or custom flex items.
   * @param {object} opts
   * @param {object} opts.row — data row
   * @param {number} opts.index — index in current page slice
   * @param {string} opts.rowKey — stable key string
   * @param {string} opts.className — `cardItem` slot classes
   * @param {import('react').ReactNode} opts.children — `cardRenderer` output or built-in card body
   */
  renderCardItem = null,

  enableServerData = false,
  serverConfig = DEFAULT_SERVER_CONFIG,

  serverTotal: _serverTotal,
  onPageChange,

  enableShowSelectedToggle = false,

  enableCardReorder: _enableCardReorder = false,
  onCardReorder: _onCardReorder,

  expandableCards = false,
  cardDetailsRenderer = null,

  enableColumnVisibility = true,

  /** Base look: semantic classes (`minimal`) or Tailwind presets (`tailwind`). */
  appearance = "minimal",
  /** Per-slot overrides; replaces preset values when keys are provided. Use `composeClassNames` to append. */
  classNames,
  /** Merged onto each slot after `classNames`, for adding framework-specific classes everywhere. */
  appendClassNames,
  /** Optional primitives: `{ Button, Input, Checkbox }` for Ant Design etc. */
  components,
}) {
  const Btn = components?.Button ?? defaultButton;
  const Inp = components?.Input ?? defaultInput;
  const Cbx = components?.Checkbox ?? defaultCheckbox;
  const pageSizeSelectId = useId();

  const slotsBaseCopy =
    appearance === "tailwind"
      ? { ...tailwindClassNames }
      : { ...defaultClassNames };
  let slots = mergeSlots(slotsBaseCopy, classNames ?? {});
  if (appendClassNames && typeof appendClassNames === "object")
    slots = appendSlots(slots, appendClassNames);

  const [rows, setRows] = useState(data);
  const [totalCount, setTotalCount] = useState(data.length);
  const [loading, setLoading] = useState(false);

  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [openFilter, setOpenFilter] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [page, setPage] = useState(1);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const [orderedData, setOrderedData] = useState(data);
  useEffect(() => setOrderedData(data), [data]);

  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState(() =>
    columns.reduce((acc, c) => ((acc[c.key] = true), acc), {})
  );

  const filterDropdownRef = useRef();
  const columnsMenuRef = useRef();
  const prevSearchForFetchRef = useRef(undefined);
  const searchRef = useRef(search);
  searchRef.current = search;

  const effectiveColumnFilterSpecs = useMemo(() => {
    if (!enableColumnFilters) return [];
    /** @type {{ key: string, column: (typeof columns)[0], mode: 'select' | 'text' }[]} */
    const specs = [];
    const seen = new Set();
    for (const col of columns) {
      if (seen.has(col.key)) continue;
      if (col.filter === false) continue;
      let mode = null;
      if (typeof col.filter === "string") {
        if (col.filter === "text" || col.filter === "select")
          mode = col.filter;
      } else if (col.filter === true) mode = "select";
      else if (filterColumns.includes(col.key)) mode = "select";
      if (!mode) continue;
      seen.add(col.key);
      specs.push({ key: col.key, column: col, mode });
    }
    return specs;
  }, [columns, filterColumns, enableColumnFilters]);

  const showColumnFiltersInTable =
    enableColumnFilters &&
    viewMode === "table" &&
    effectiveColumnFilterSpecs.length > 0;

  /** Column filters never hit the wire; they subset whatever is already in `orderedData` (one server page when `enableServerData`). */
  const applyColumnFiltersOnClient = useMemo(
    () =>
      enableColumnFilters &&
      viewMode === "table" &&
      effectiveColumnFilterSpecs.length > 0,
    [enableColumnFilters, viewMode, effectiveColumnFilterSpecs.length]
  );

  const filtersPayloadFingerprint = useMemo(
    () => JSON.stringify(serializeColumnFiltersPayload(filters, effectiveColumnFilterSpecs)),
    [filters, effectiveColumnFilterSpecs]
  );

  const fetchServerData = useCallback(
    async (pageNum) => {
      if (!enableServerData || !serverConfig.url) return;
      setLoading(true);

      const trimmed = searchRef.current.trim();
      const sendSearch =
        enableSearch &&
        serverConfig.searchParam &&
        typeof serverConfig.searchParam === "string" &&
        trimmed;

      let response;

      if (serverConfig.method === "GET") {
        const q = new URLSearchParams({
          [serverConfig.pageParam]: pageNum,
          [serverConfig.limitParam]: pageSize,
          ...serverConfig.defaultParams,
        });
        if (sendSearch)
          q.set(serverConfig.searchParam, trimmed);

        response = await fetch(`${serverConfig.url}?${q.toString()}`, {
          cache: "no-store",
        });
      } else {
        const bodyPayload = {
          [serverConfig.pageParam]: pageNum,
          [serverConfig.limitParam]: pageSize,
          ...serverConfig.defaultParams,
        };
        if (sendSearch)
          bodyPayload[serverConfig.searchParam] = trimmed;

        response = await fetch(serverConfig.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload),
        });
      }

      const json = await response.json();

      setRows(json[serverConfig.dataPath]);
      setTotalCount(json[serverConfig.totalPath]);
      setOrderedData(json[serverConfig.dataPath]);
      setPage(pageNum);
      setLoading(false);
    },
    [
      enableServerData,
      enableSearch,
      serverConfig.url,
      serverConfig.method,
      serverConfig.pageParam,
      serverConfig.limitParam,
      serverConfig.searchParam,
      serverConfig.dataPath,
      serverConfig.totalPath,
      serverConfig.defaultParams,
      pageSize,
    ]
  );

  const normalizedPageSizeChoices = useMemo(() => {
    if (
      !pageSizeOptions ||
      !Array.isArray(pageSizeOptions) ||
      pageSizeOptions.length === 0
    )
      return [];
    const merged = [...new Set([...pageSizeOptions, pageSize])].filter(
      (n) => typeof n === "number" && Number.isFinite(n) && n >= 1
    );
    return merged.sort((a, b) => a - b);
  }, [pageSizeOptions, pageSize]);

  const showPageSizeControl =
    enablePagination &&
    normalizedPageSizeChoices.length > 0 &&
    typeof onPageSizeChange === "function";

  const prevPageSizeForEffectRef = useRef(pageSize);
  useEffect(() => {
    if (!enablePagination) return;
    if (prevPageSizeForEffectRef.current === pageSize) return;
    prevPageSizeForEffectRef.current = pageSize;
    if (!enableServerData) {
      setPage(1);
      return;
    }
    if (page !== 1) setPage(1);
    else void fetchServerData(1);
  }, [pageSize, page, enablePagination, enableServerData, fetchServerData]);

  useEffect(() => {
    if (enableServerData) return;
    setRows(data);
    setTotalCount(data.length);
  }, [data, enableServerData]);

  useEffect(() => {
    if (!enableServerData) return;
    if (
      enableSearch &&
      serverConfig.searchParam &&
      typeof serverConfig.searchParam === "string"
    )
      return;
    fetchServerData(page);
  }, [
    page,
    enableServerData,
    fetchServerData,
    enableSearch,
    serverConfig.searchParam,
  ]);

  useEffect(() => {
    if (!enableServerData) return;
    if (
      !enableSearch ||
      !serverConfig.searchParam ||
      typeof serverConfig.searchParam !== "string"
    )
      return;

    let fetchNow = true;
    if (prevSearchForFetchRef.current !== search) {
      prevSearchForFetchRef.current = search;
      if (page !== 1) {
        setPage(1);
        fetchNow = false;
      }
    }

    if (fetchNow) fetchServerData(page);
  }, [
    page,
    enableServerData,
    enableSearch,
    search,
    fetchServerData,
    serverConfig.searchParam,
  ]);

  useEffect(() => {
    if (enableServerData) return;
    if (!enableColumnFilters || effectiveColumnFilterSpecs.length === 0)
      return;
    setPage(1);
  }, [
    filtersPayloadFingerprint,
    enableServerData,
    enableColumnFilters,
    effectiveColumnFilterSpecs.length,
  ]);

  useEffect(() => {
    if (viewMode === "card") setOpenFilter(null);
  }, [viewMode]);

  useEffect(() => {
    const handler = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target))
        setOpenFilter(null);

      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target))
        setColumnsMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const baseRows = useMemo(() => {
    if (!enableShowSelectedToggle || selectedRows.length === 0) return orderedData;
    const setSel = new Set(selectedRows);
    return orderedData.filter((r) => setSel.has(r));
  }, [orderedData, enableShowSelectedToggle, selectedRows]);

  const selectFilterOptionsByKey = useMemo(() => {
    const out = {};
    for (const s of effectiveColumnFilterSpecs) {
      if (s.mode !== "select") continue;
      const uniq = new Set();
      for (const row of baseRows) {
        const v = row[s.key];
        if (v != null && typeof v !== "object") uniq.add(v);
      }
      out[s.key] = [...uniq].sort((a, b) =>
        String(a).localeCompare(String(b), undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
    }
    return out;
  }, [baseRows, effectiveColumnFilterSpecs]);

  const filteredData = useMemo(() => {
    let output = [...baseRows];

    const serverHandlesSearch =
      enableServerData &&
      enableSearch &&
      serverConfig.searchParam &&
      typeof serverConfig.searchParam === "string";

    if (!serverHandlesSearch && enableSearch && search.trim()) {
      const s = search.toLowerCase();
      output = output.filter((row) =>
        Object.values(row).some((val) => {
          if (val == null || typeof val === "object") return false;
          return String(val).toLowerCase().includes(s);
        })
      );
    }

    if (applyColumnFiltersOnClient) {
      output = applyColumnFiltersToRows(
        output,
        effectiveColumnFilterSpecs,
        filters
      );
    }

    if (sortKey) {
      output.sort((a, b) => {
        const A = a[sortKey];
        const B = b[sortKey];
        if (A == null && B == null) return 0;
        if (A == null) return sortDir === "asc" ? 1 : -1;
        if (B == null) return sortDir === "asc" ? -1 : 1;
        let r;
        if (typeof A === "number" && typeof B === "number")
          r = A - B;
        else
          r = String(A).localeCompare(String(B), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        return sortDir === "asc" ? r : -r;
      });
    }

    return output;
  }, [
    baseRows,
    enableSearch,
    search,
    filters,
    applyColumnFiltersOnClient,
    effectiveColumnFilterSpecs,
    sortKey,
    sortDir,
    enableServerData,
    serverConfig.searchParam,
  ]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return filteredData;
    if (enableServerData) return filteredData;
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, enablePagination, enableServerData, page, pageSize]);

  const totalPages = useMemo(() => {
    if (!enablePagination) return 1;
    if (!enableServerData)
      return Math.max(1, Math.ceil(filteredData.length / pageSize));
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [
    enablePagination,
    enableServerData,
    filteredData.length,
    totalCount,
    pageSize,
  ]);

  const goToPage = (next) => {
    if (!enablePagination) return;
    setPage(next);
    onPageChange?.(next);
  };

  const toggleSelectFilterOption = useCallback((colKey, rawVal) => {
    setFilters((prev) => {
      const curr = Array.isArray(prev[colKey]) ? [...prev[colKey]] : [];
      const i = curr.findIndex((v) => Object.is(v, rawVal));
      if (i >= 0) curr.splice(i, 1);
      else curr.push(rawVal);
      const next = { ...prev };
      if (curr.length === 0) delete next[colKey];
      else next[colKey] = curr;
      return next;
    });
  }, []);

  const updateTextColumnFilter = useCallback((colKey, txt) => {
    setFilters((prev) => {
      const next = { ...prev };
      const t = typeof txt === "string" ? txt : "";
      if (t.trim() === "") delete next[colKey];
      else next[colKey] = t;
      return next;
    });
  }, []);

  const clearColumnFilterKey = useCallback((colKey) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  }, []);

  const toggleRowSelection = (row) => {
    setSelectedRows((prev) =>
      prev.includes(row) ? prev.filter((r) => r !== row) : [...prev, row]
    );
  };

  const csvEscape = (val) => {
    if (val == null) return "";
    const s = String(val);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const exportCSV = (rowsToExport) => {
    const csvColumns = columns.filter((c) => c.exportable !== false);
    const headers = csvColumns.map((c) => c.label);
    const lines = rowsToExport.map((r) =>
      csvColumns.map((c) => csvEscape(r[c.key])).join(",")
    );
    const csvContent = [headers.join(","), ...lines].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const [expandedSet, setExpandedSet] = useState(() => new Set());
  const toggleCardExpand = (row) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      next.has(row) ? next.delete(row) : next.add(row);
      return next;
    });
  };

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleCols[c.key]),
    [columns, visibleCols]
  );

  const isColumnSortable = (col) => {
    if (typeof sortAll === "boolean") return sortAll;
    if (sortColumns.length > 0) return sortColumns.includes(col.key);
    return Boolean(col.sort);
  };

  const resolveCellContent = (c, row) => {
    if (c.render) return c.render(row);
    if (c.format) return formatDisplayValue(row[c.key], c.format);
    return row[c.key];
  };

  const handleSort = (colKey) => {
    const col = columns.find((c) => c.key === colKey);
    if (!col || !isColumnSortable(col)) return;
    if (sortKey === colKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(colKey);
      setSortDir("asc");
    }
  };

  const DefaultCard = ({ row, isSelected }) => (
    <div
      className={cx(
        slots.card,
        isSelected && slots.card_selected
      )}
    >
      {enableCardSelection && enableExportSelected && (
        <Cbx
          className={slots.cardSelectCheckbox}
          checked={isSelected}
          onChange={() => toggleRowSelection(row)}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className={slots.cardFields}>
        {visibleColumns.map((c) => (
          <div key={c.key} className={slots.cardField}>
            <span className={slots.cardLabel}>{c.label}</span>
            <div className={slots.cardValue}>
              {resolveCellContent(c, row)}
            </div>
          </div>
        ))}
      </div>

      {expandableCards && (
        <>
          <Btn
            className={slots.cardExpandToggle}
            onClick={(e) => {
              e.stopPropagation();
              toggleCardExpand(row);
            }}
          >
            {expandedSet.has(row) ? "Hide details" : "Show details"}
          </Btn>

          {expandedSet.has(row) && (
            <div className={slots.cardDetails}>
              {cardDetailsRenderer ? (
                cardDetailsRenderer(row)
              ) : (
                <pre className={slots.cardJson}>{JSON.stringify(row, null, 2)}</pre>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCardMode = () => {
    if (loading) return <div className={slots.loading}>Loading...</div>;

    const layoutMode = cardLayout === "list" ? "list" : "grid";
    const cardGridClassName = cx(
      slots.cardGrid,
      cardLayout === "list" && slots.cardGrid_list
    );

    const cardItems = paginatedData.map((row, idx) => {
      const rk = stableRowKey(row, idx);
      const isSelected = selectedRows.includes(row);
      const inner =
        cardRenderer?.(row, isSelected, () => toggleRowSelection(row)) ??
        (<DefaultCard row={row} isSelected={isSelected} />);

      const defaultItem = (
        <div key={rk} className={slots.cardItem}>
          {inner}
        </div>
      );

      if (!renderCardItem) return defaultItem;

      return (
        <Fragment key={rk}>
          {renderCardItem({
            row,
            index: idx,
            rowKey: rk,
            className: slots.cardItem,
            children: inner,
          })}
        </Fragment>
      );
    });

    const defaultGrid = (
      <div
        className={cardGridClassName}
        data-card-layout={layoutMode}
      >
        {cardItems}
      </div>
    );

    return renderCardGrid
      ? renderCardGrid({
          children: cardItems,
          className: cardGridClassName,
          layout: layoutMode,
        })
      : defaultGrid;
  };

  const renderTableMode = () =>
    loading ? (
      <div className={slots.loading}>Loading...</div>
    ) : (
      <div ref={filterDropdownRef} className={slots.tableWrap}>
        <table className={slots.table}>
          <thead className={slots.thead}>
            <tr className={slots.theadRow}>
              {enableExportSelected && (
                <th scope="col" className={slots.thSelect}>
                  Select
                </th>
              )}

              {visibleColumns.map((col) => {
                const sortable = isColumnSortable(col);
                const active = sortKey === col.key;
                const spec = effectiveColumnFilterSpecs.find(
                  (s) => s.key === col.key
                );
                const allowColumnFilter = showColumnFiltersInTable && !!spec;
                const filterActive =
                  !!spec &&
                  (spec.mode === "text"
                    ? typeof filters[col.key] === "string" &&
                      filters[col.key].trim() !== ""
                    : Array.isArray(filters[col.key]) &&
                      filters[col.key].length > 0);

                return (
                  <th
                    scope="col"
                    key={col.key}
                    className={cx(
                      slots.th,
                      allowColumnFilter && slots.thRelative
                    )}
                    aria-sort={
                      !sortable
                        ? undefined
                        : active
                          ? sortDir === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                    }
                  >
                    <div className={slots.thInner}>
                      <span
                        role={sortable ? "button" : undefined}
                        tabIndex={sortable ? 0 : undefined}
                        onKeyDown={(e) => {
                          if (
                            sortable &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            handleSort(col.key);
                          }
                        }}
                        className={cx(
                          slots.thSortLabel,
                          sortable ? undefined : slots.thSortLabelInactive
                        )}
                        onClick={() => sortable && handleSort(col.key)}
                      >
                        <span className={slots.thSortLabelText}>
                          {col.label}
                        </span>
                        {sortable && (
                          <span
                            className={slots.thSortArrows}
                            aria-hidden
                          >
                            <span
                              className={cx(
                                slots.thSortArrow,
                                active && sortDir === "asc"
                                  ? slots.thSortArrowActive
                                  : slots.thSortArrowInactive
                              )}
                            >
                              ▲
                            </span>
                            <span
                              className={cx(
                                slots.thSortArrow,
                                active && sortDir === "desc"
                                  ? slots.thSortArrowActive
                                  : slots.thSortArrowInactive
                              )}
                            >
                              ▼
                            </span>
                          </span>
                        )}
                      </span>

                      {allowColumnFilter && spec && (
                        <Btn
                          type="button"
                          className={cx(
                            slots.filterToggle,
                            filterActive && slots.filterToggleActive
                          )}
                          aria-label={`Filter ${col.label}`}
                          aria-expanded={openFilter === col.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenFilter((k) =>
                              k === col.key ? null : col.key
                            );
                          }}
                        >
                          🔍
                        </Btn>
                      )}
                    </div>

                    {allowColumnFilter &&
                      spec &&
                      openFilter === col.key && (
                        <div
                          className={slots.filterPanel}
                          role="dialog"
                          aria-label={`${col.label} filter`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={slots.filterPanelHeader}>
                            <span>Filter</span>
                          </div>

                          {spec.mode === "select" ? (
                            selectFilterOptionsByKey[col.key]?.length ? (
                              selectFilterOptionsByKey[col.key].map(
                                (opt) => {
                                  const selected = !!(
                                    Array.isArray(filters[col.key]) &&
                                    filters[col.key].some((v) =>
                                      Object.is(v, opt)
                                    )
                                  );
                                  return (
                                    <label
                                      key={String(opt)}
                                      className={slots.filterOptionRow}
                                    >
                                      <Cbx
                                        checked={selected}
                                        onChange={() =>
                                          toggleSelectFilterOption(
                                            col.key,
                                            opt
                                          )
                                        }
                                      />
                                      <span>{String(opt)}</span>
                                    </label>
                                  );
                                }
                              )
                            ) : (
                              <p className={slots.filterEmptyHint}>
                                No values
                              </p>
                            )
                          ) : (
                            <Inp
                              type="search"
                              autoFocus
                              placeholder="Contains…"
                              className={slots.filterTextInput}
                              value={
                                typeof filters[col.key] === "string"
                                  ? filters[col.key]
                                  : ""
                              }
                              onChange={(e) =>
                                updateTextColumnFilter(
                                  col.key,
                                  e.target.value
                                )
                              }
                            />
                          )}

                          <Btn
                            type="button"
                            className={slots.filterClearBtn}
                            onClick={() => {
                              clearColumnFilterKey(col.key);
                              setOpenFilter(null);
                            }}
                          >
                            Clear
                          </Btn>
                        </div>
                      )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={slots.tbody}>
            {paginatedData.map((row, idx) => (
              <tr key={stableRowKey(row, idx)} className={slots.tr}>
                {enableExportSelected && (
                  <td className={slots.tdSelect}>
                    <Cbx
                      className={slots.checkbox}
                      checked={selectedRows.includes(row)}
                      onChange={() => toggleRowSelection(row)}
                    />
                  </td>
                )}

                {visibleColumns.map((c) => (
                  <td key={c.key} className={slots.td}>
                    {resolveCellContent(c, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <div className={slots.root} data-appearance={appearance}>
      <div className={slots.toolbar}>
        <div className={slots.toolbarInner}>
          {enableColumnVisibility && (
            <div ref={columnsMenuRef} className={slots.columnsMenuWrapper}>
              <Btn
                className={slots.columnsTrigger}
                onClick={() => setColumnsMenuOpen((s) => !s)}
              >
                Columns
              </Btn>

              {columnsMenuOpen && (
                <div className={slots.columnsMenu}>
                  {columns.map((c) => (
                    <label key={c.key} className={slots.columnsMenuItem}>
                      <Cbx
                        checked={!!visibleCols[c.key]}
                        onChange={() =>
                          setVisibleCols((prev) => ({
                            ...prev,
                            [c.key]: !prev[c.key],
                          }))
                        }
                      />
                      <span>{c.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {enableShowSelectedToggle && (
            <label className={slots.showSelectedToggle}>
              <Cbx
                className={slots.showSelectedCheckbox}
                checked={showSelectedOnly}
                onChange={(e) =>
                  setShowSelectedOnly(e.target.checked)
                }
              />
              Show selected only
            </label>
          )}

          {enableExportSelected && (
            <Btn
              onClick={() => exportCSV(selectedRows)}
              disabled={selectedRows.length === 0}
              className={slots.exportSecondaryButton}
            >
              Export Selected
            </Btn>
          )}

          {enableExport && (
            <Btn
              onClick={() => exportCSV(rows)}
              className={slots.exportPrimaryButton}
            >
              Export All
            </Btn>
          )}

          {enableSearch && (
            <Inp
              className={slots.searchInput}
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className={slots.body}>
        {viewMode === "card" ? renderCardMode() : renderTableMode()}

        {enablePagination && (
          <div className={slots.pagination}>
            {showPageSizeControl ? (
              <div className={slots.paginationPageSizeWrap}>
                <label
                  htmlFor={pageSizeSelectId}
                  className={slots.paginationPageSizeLabel}
                >
                  Rows per page
                </label>
                <select
                  id={pageSizeSelectId}
                  className={slots.pageSizeSelect}
                  aria-label="Rows per page"
                  value={String(pageSize)}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (!Number.isFinite(next) || next < 1) return;
                    onPageSizeChange?.(next);
                  }}
                >
                  {normalizedPageSizeChoices.map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className={slots.paginationNav}>
              <Btn
                disabled={page <= 1}
                className={slots.pageButton}
                onClick={() => goToPage(page - 1)}
              >
                ← Prev
              </Btn>

              <span className={slots.paginationInfo}>
                Page {page} of {totalPages}
              </span>

              <Btn
                disabled={page >= totalPages}
                className={slots.pageButton}
                onClick={() => goToPage(page + 1)}
              >
                Next →
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
