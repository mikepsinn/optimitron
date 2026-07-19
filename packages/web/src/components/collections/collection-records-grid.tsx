"use client";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeBalham,
  type CellEditRequestEvent,
  type ColDef,
  type FilterModel,
  type GridApi,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Check,
  Columns3,
  Download,
  Pencil,
  Plus,
  Save,
  Search,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CollectionColumnHeader,
  type CollectionGridContext,
} from "@/components/collections/collection-column-header";
import {
  type ColumnSettingsMap,
  formatCellValue,
  loadColumnSettings,
  saveColumnSettings,
} from "@/components/collections/collection-column-settings";
import { Button } from "@/components/retroui/Button";
import { Checkbox } from "@/components/retroui/Checkbox";
import { Input } from "@/components/retroui/Input";
import { Popover } from "@/components/retroui/Popover";
import { Select } from "@/components/retroui/Select";
import { API_ROUTES } from "@/lib/api-routes";

ModuleRegistry.registerModules([AllCommunityModule]);

export interface CollectionField {
  id: string;
  key: string;
  name: string;
  options: unknown;
  position: number;
  required: boolean;
  type: string;
}

export interface CollectionRecord {
  id: string;
  relations: Array<{ id: string }>;
  updatedAt: string;
  values: Record<string, unknown>;
  version: number;
}

interface CollectionFilter {
  fieldKey: string;
  operator:
    | "contains"
    | "equals"
    | "greaterThan"
    | "isEmpty"
    | "lessThan"
    | "notEquals";
  value?: unknown;
}

interface CollectionSort {
  direction: "asc" | "desc";
  fieldKey: string;
}

interface RecordQuery {
  filters: CollectionFilter[];
  query: string;
  sorts: CollectionSort[];
}

export interface CollectionView {
  filter: CollectionFilter[];
  id: string;
  isDefault: boolean;
  name: string;
  sort: CollectionSort[];
  version: number;
  visibleFieldIds: string[];
}

const EDITABLE_TYPES = new Set([
  "BOOLEAN",
  "DATE",
  "EMAIL",
  "MULTI_SELECT",
  "NUMBER",
  "RICH_TEXT",
  "SELECT",
  "TEXT",
  "URL",
]);

const GRID_THEME = themeBalham.withParams({
  accentColor: "var(--foreground)",
  backgroundColor: "var(--background)",
  borderColor: "var(--border)",
  borderRadius: 0,
  cellTextColor: "var(--foreground)",
  fontFamily: "inherit",
  fontSize: 14,
  headerColumnBorder: true,
  headerFontWeight: 700,
  headerTextColor: "var(--foreground)",
  oddRowBackgroundColor: "var(--background)",
  popupShadow: "none",
  rowHoverColor: "color-mix(in srgb, var(--foreground) 5%, var(--background))",
  selectedRowBackgroundColor:
    "color-mix(in srgb, var(--foreground) 8%, var(--background))",
  wrapperBorderRadius: 0,
});

const GRID_DEFAULT_COLUMN: ColDef<CollectionRecord> = {
  floatingFilter: true,
  minWidth: 140,
  resizable: true,
  sortable: true,
};

const GRID_PAGE_SIZES = [25, 50, 100];

function optionValues(options: unknown): string[] {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return [];
  }
  const values = (options as { options?: unknown }).options;
  if (!Array.isArray(values)) return [];
  return values.flatMap((option) => {
    if (typeof option === "string") return [option];
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      return [];
    }
    const row = option as { id?: unknown; name?: unknown };
    if (typeof row.name === "string") return [row.name];
    if (typeof row.id === "string") return [row.id];
    return [];
  });
}

function formulaText(options: unknown): string | null {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return null;
  }
  const row = options as {
    expression?: unknown;
    formula?: unknown;
    formulaText?: unknown;
  };
  for (const value of [row.expression, row.formulaText, row.formula]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function gridValue(value: unknown, field: CollectionField): unknown {
  if (value == null) return null;
  if (field.type === "BOOLEAN") return value === true;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function normalizedCellValue(field: CollectionField, value: unknown): unknown {
  if (field.type === "BOOLEAN") return value === true;
  if (field.type === "NUMBER") {
    if (value == null || String(value).trim() === "") return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
      throw new Error(`${field.name} needs a number.`);
    return parsed;
  }
  if (field.type === "MULTI_SELECT") {
    const values = Array.isArray(value)
      ? value
      : String(value ?? "").split(",");
    return values.map((item) => String(item).trim()).filter(Boolean);
  }
  if (value == null) return null;
  return String(value).trim() || null;
}

function filterType(field: CollectionField): "date" | "number" | "text" {
  if (field.type === "DATE") return "date";
  if (field.type === "NUMBER") return "number";
  return "text";
}

function gridFilterModel(
  filters: CollectionFilter[],
  fields: CollectionField[],
): FilterModel {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const result: FilterModel = {};
  for (const filter of filters) {
    const field = fieldsByKey.get(filter.fieldKey);
    if (!field) continue;
    const type = filterType(field);
    const operator =
      filter.operator === "notEquals"
        ? "notEqual"
        : filter.operator === "isEmpty"
          ? "blank"
          : filter.operator;
    if (
      type !== "text" &&
      operator !== "equals" &&
      operator !== "notEqual" &&
      operator !== "lessThan" &&
      operator !== "greaterThan" &&
      operator !== "blank"
    ) {
      continue;
    }
    if (type === "date") {
      const date = String(filter.value ?? "").slice(0, 10);
      result[field.id] = {
        dateFrom: operator === "blank" ? null : `${date} 00:00:00`,
        filterType: "date",
        type: operator,
      };
      continue;
    }
    result[field.id] = {
      ...(operator === "blank"
        ? {}
        : {
            filter:
              type === "number"
                ? Number(filter.value)
                : field.type === "BOOLEAN" && typeof filter.value === "boolean"
                  ? filter.value
                    ? "Yes"
                    : "No"
                  : String(filter.value),
          }),
      filterType: type,
      type: operator,
    };
  }
  return result;
}

function savedSorts(
  api: GridApi<CollectionRecord>,
  fieldsById: Map<string, CollectionField>,
): CollectionSort[] {
  return api
    .getColumnState()
    .filter(
      (column) =>
        (column.sort === "asc" || column.sort === "desc") &&
        fieldsById.has(column.colId),
    )
    .sort(
      (left, right) =>
        (left.sortIndex ?? Number.MAX_SAFE_INTEGER) -
        (right.sortIndex ?? Number.MAX_SAFE_INTEGER),
    )
    .map((column) => ({
      direction: column.sort as "asc" | "desc",
      fieldKey: fieldsById.get(column.colId)!.key,
    }));
}

function querySignature(query: RecordQuery): string {
  return JSON.stringify(query);
}

function savedFilters(
  model: FilterModel,
  fieldsById: Map<string, CollectionField>,
): CollectionFilter[] {
  return Object.entries(model).flatMap(([fieldId, value]) => {
    const field = fieldsById.get(fieldId);
    if (!field || !value || typeof value !== "object") return [];
    const filter = value as {
      dateFrom?: unknown;
      filter?: unknown;
      type?: unknown;
    };
    const operator =
      filter.type === "notEqual"
        ? "notEquals"
        : filter.type === "blank"
          ? "isEmpty"
          : filter.type;
    if (
      operator !== "contains" &&
      operator !== "equals" &&
      operator !== "greaterThan" &&
      operator !== "isEmpty" &&
      operator !== "lessThan" &&
      operator !== "notEquals"
    ) {
      return [];
    }
    return [
      {
        fieldKey: field.key,
        operator,
        ...(operator === "isEmpty"
          ? {}
          : {
              value:
                field.type === "DATE"
                  ? String(filter.dateFrom ?? "").slice(0, 10)
                  : filter.filter,
            }),
      } satisfies CollectionFilter,
    ];
  });
}

function initialGridState(
  fields: CollectionField[],
  view: CollectionView | null,
) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const visible = view?.visibleFieldIds ?? [];
  const visibleSet = new Set(visible);
  const orderedIds = visible.length
    ? [
        ...visible.filter((id) => fields.some((field) => field.id === id)),
        ...fields.map((field) => field.id).filter((id) => !visibleSet.has(id)),
      ]
    : fields.map((field) => field.id);
  return {
    columnOrder: { orderedColIds: orderedIds },
    columnVisibility: {
      hiddenColIds: visible.length
        ? fields.map((field) => field.id).filter((id) => !visibleSet.has(id))
        : [],
    },
    filter: { filterModel: gridFilterModel(view?.filter ?? [], fields) },
    partialColumnState: true,
    sort: {
      sortModel: (view?.sort ?? []).flatMap((sort) => {
        const field = fieldsByKey.get(sort.fieldKey);
        return field ? [{ colId: field.id, sort: sort.direction }] : [];
      }),
    },
  } as const;
}

function recordPayload(payload: unknown): CollectionRecord | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const record = (payload as { record?: unknown }).record;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return null;
  }
  return record as CollectionRecord;
}

export function CollectionRecordsGrid({
  canEdit,
  canSaveView,
  collectionId,
  collectionName,
  fields,
  focusedRecordId,
  initialNextCursor,
  initialView,
  onEditRecord,
  onRecordsAdded,
  onRecordsReplaced,
  onRecordUpdated,
  records,
  views,
}: {
  canEdit: boolean;
  canSaveView: boolean;
  collectionId: string;
  collectionName?: string;
  fields: CollectionField[];
  focusedRecordId: string | null;
  initialNextCursor: string | null;
  initialView: CollectionView | null;
  onEditRecord: (record: CollectionRecord) => void;
  onRecordsAdded: (records: CollectionRecord[]) => void;
  onRecordsReplaced: (records: CollectionRecord[]) => void;
  onRecordUpdated: (record: CollectionRecord) => void;
  records: CollectionRecord[];
  views: CollectionView[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridApi = useRef<GridApi<CollectionRecord> | null>(null);
  const displayedInitialView = useMemo(
    () =>
      focusedRecordId && initialView
        ? { ...initialView, filter: [], sort: [] }
        : initialView,
    [focusedRecordId, initialView],
  );
  const initialQuery = useMemo<RecordQuery>(
    () => ({
      filters: displayedInitialView?.filter ?? [],
      query: "",
      sorts: displayedInitialView?.sort ?? [],
    }),
    [displayedInitialView],
  );
  const activeQuery = useRef<RecordQuery>(initialQuery);
  const lastLoadedQuery = useRef(querySignature(initialQuery));
  const queryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSequence = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSavingView, setIsSavingView] = useState(false);
  const [newViewName, setNewViewName] = useState("");
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [quickFilter, setQuickFilter] = useState("");
  const [viewSaved, setViewSaved] = useState(Boolean(initialView));
  const [savedView, setSavedView] = useState<Pick<
    CollectionView,
    "id" | "isDefault" | "name" | "version"
  > | null>(initialView);
  const [visibleFieldIds, setVisibleFieldIds] = useState(() =>
    initialView?.visibleFieldIds.length
      ? initialView.visibleFieldIds
      : fields.map((field) => field.id),
  );
  const persistenceViewId = initialView?.id ?? null;
  const [columnSettings, setColumnSettings] = useState<ColumnSettingsMap>(() =>
    loadColumnSettings(collectionId, persistenceViewId),
  );
  const columnSettingsRef = useRef(columnSettings);
  columnSettingsRef.current = columnSettings;
  const applyColumnSetting = useCallback<CollectionGridContext["onColumnSetting"]>(
    (colId, patch) => {
      setColumnSettings((current) => {
        const next: ColumnSettingsMap = { ...current };
        if (patch === null) {
          delete next[colId];
        } else {
          next[colId] = { ...current[colId], ...patch };
        }
        columnSettingsRef.current = next;
        saveColumnSettings(collectionId, persistenceViewId, next);
        return next;
      });
    },
    [collectionId, persistenceViewId],
  );
  const gridContext = useMemo<CollectionGridContext>(
    () => ({
      getColumnSetting: (colId) => columnSettingsRef.current[colId],
      onColumnSetting: applyColumnSetting,
    }),
    [applyColumnSetting],
  );
  const orderedFields = useMemo(
    () => [...fields].sort((left, right) => left.position - right.position),
    [fields],
  );
  const fieldsById = useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [fields],
  );
  const initialState = useMemo(
    () => initialGridState(orderedFields, displayedInitialView),
    [displayedInitialView, orderedFields],
  );
  const gridHeight = Math.min(
    576,
    Math.max(248, 126 + Math.min(records.length, 25) * 42),
  );

  useEffect(
    () => () => {
      if (queryTimer.current) clearTimeout(queryTimer.current);
      requestSequence.current += 1;
    },
    [],
  );

  // Wrap-text toggles switch autoHeight on/off; recompute row heights so rows
  // grow or snap back to the fixed height. No-op before the grid is ready.
  useEffect(() => {
    gridApi.current?.resetRowHeights();
  }, [columnSettings]);

  const columnDefs = useMemo<ColDef<CollectionRecord>[]>(() => {
    const columns = orderedFields.map((field) => {
      const options = optionValues(field.options);
      const type = filterType(field);
      const expression = formulaText(field.options);
      const editable = canEdit && EDITABLE_TYPES.has(field.type);
      const setting = columnSettings[field.id] ?? {};
      const column: ColDef<CollectionRecord> = {
        cellDataType:
          field.type === "BOOLEAN"
            ? "boolean"
            : field.type === "DATE"
              ? "dateString"
              : field.type === "NUMBER"
                ? "number"
                : false,
        colId: field.id,
        editable,
        field: undefined,
        filter:
          type === "number"
            ? "agNumberColumnFilter"
            : type === "date"
              ? "agDateColumnFilter"
              : "agTextColumnFilter",
        filterParams: {
          browserDatePicker: type === "date",
          filterOptions:
            type === "text"
              ? ["contains", "equals", "notEqual", "blank"]
              : ["equals", "notEqual", "lessThan", "greaterThan", "blank"],
          maxNumConditions: 1,
          trimInput: true,
        },
        filterValueGetter: ({ data }) => {
          const value = data?.values[field.key];
          if (field.type === "BOOLEAN") {
            return value == null ? "" : value === true ? "Yes" : "No";
          }
          return gridValue(value, field);
        },
        headerComponent: CollectionColumnHeader,
        headerComponentParams: { fieldType: field.type },
        headerName: field.name,
        headerTooltip: expression ? `${field.name}: ${expression}` : field.name,
        minWidth: field.type === "RICH_TEXT" ? 260 : 160,
        suppressHeaderMenuButton: true,
        tooltipValueGetter: ({ value }) => (value == null ? "" : String(value)),
        valueFormatter: ({ value }) =>
          formatCellValue(field.type, setting.format, value),
        valueGetter: ({ data }) => gridValue(data?.values[field.key], field),
      };
      if (setting.wrapText) {
        column.wrapText = true;
        column.autoHeight = true;
      }
      if (setting.align) {
        column.cellStyle = {
          ...(typeof column.cellStyle === "object" ? column.cellStyle : {}),
          textAlign: setting.align,
        };
      }
      if (field.type === "BOOLEAN") {
        column.cellEditor = "agCheckboxCellEditor";
        column.cellRenderer = ({
          value,
        }: ICellRendererParams<CollectionRecord>) =>
          value === true ? (
            <Check aria-label="Yes" className="h-4 w-4" />
          ) : value === false ? (
            <span aria-label="No">-</span>
          ) : null;
      } else if (field.type === "DATE") {
        column.cellEditor = "agDateStringCellEditor";
      } else if (field.type === "NUMBER") {
        column.cellEditor = "agNumberCellEditor";
      } else if (field.type === "SELECT" && options.length) {
        column.cellEditor = "agSelectCellEditor";
        column.cellEditorParams = { values: options };
      } else if (field.type === "RICH_TEXT") {
        column.cellEditor = "agLargeTextCellEditor";
        column.cellEditorParams = { cols: 60, maxLength: 100_000, rows: 10 };
        column.cellEditorPopup = true;
      } else if (editable) {
        column.cellEditor = "agTextCellEditor";
      }
      if (field.type === "URL") {
        column.cellRenderer = ({
          value,
        }: ICellRendererParams<CollectionRecord>) =>
          typeof value === "string" && value ? (
            <a
              className="underline underline-offset-4"
              href={value}
              onClick={(event) => event.stopPropagation()}
              rel="noreferrer"
              target="_blank"
            >
              {value}
            </a>
          ) : null;
      }
      return column;
    });
    if (
      canEdit &&
      orderedFields.some((field) => EDITABLE_TYPES.has(field.type))
    ) {
      columns.push({
        cellRenderer: ({ data }: ICellRendererParams<CollectionRecord>) =>
          data ? (
            <button
              aria-label="Edit row"
              className="flex h-8 w-8 items-center justify-center border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background"
              onClick={() => onEditRecord(data)}
              title="Edit row"
              type="button"
            >
              <Pencil className="h-4 w-4" />
            </button>
          ) : null,
        colId: "__actions",
        editable: false,
        filter: false,
        headerName: "",
        lockPinned: true,
        maxWidth: 52,
        minWidth: 52,
        pinned: "right",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
        width: 52,
      });
    }
    return columns;
  }, [canEdit, columnSettings, onEditRecord, orderedFields]);

  async function saveCell(event: CellEditRequestEvent<CollectionRecord>) {
    const field = fieldsById.get(event.column.getColId());
    if (!field || !event.data || !EDITABLE_TYPES.has(field.type)) return;
    try {
      const value = normalizedCellValue(field, event.newValue);
      if (
        JSON.stringify(value) === JSON.stringify(event.data.values[field.key])
      ) {
        return;
      }
      setError(null);
      const response = await fetch(
        API_ROUTES.collections.record(collectionId, event.data.id),
        {
          body: JSON.stringify({
            expectedVersion: event.data.version,
            values: { [field.key]: value },
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      const payload = (await response.json().catch(() => null)) as unknown;
      const record = recordPayload(payload);
      if (!response.ok || !record) {
        const message =
          payload && typeof payload === "object" && !Array.isArray(payload)
            ? (payload as { error?: unknown }).error
            : null;
        throw new Error(
          typeof message === "string" ? message : "Could not save the cell.",
        );
      }
      onRecordUpdated(record);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the cell.",
      );
    }
  }

  async function fetchRows(input: {
    append: boolean;
    cursor?: string | null;
    query: RecordQuery;
  }) {
    const sequence = ++requestSequence.current;
    const parameters = new URLSearchParams({ limit: "100" });
    if (input.cursor) parameters.set("cursor", input.cursor);
    if (input.query.filters.length) {
      parameters.set("filters", JSON.stringify(input.query.filters));
    }
    if (input.query.query) parameters.set("q", input.query.query);
    if (input.query.sorts.length) {
      parameters.set("sorts", JSON.stringify(input.query.sorts));
    }
    const response = await fetch(
      `${API_ROUTES.collections.records(collectionId)}?${parameters}`,
      { cache: "no-store" },
    );
    const payload = (await response.json().catch(() => null)) as {
      error?: unknown;
      nextCursor?: unknown;
      records?: unknown;
    } | null;
    if (sequence !== requestSequence.current) return null;
    if (!response.ok || !Array.isArray(payload?.records)) {
      throw new Error(
        typeof payload?.error === "string"
          ? payload.error
          : "Could not load rows.",
      );
    }
    const loaded = payload.records as CollectionRecord[];
    if (input.append) onRecordsAdded(loaded);
    else onRecordsReplaced(loaded);
    const cursor =
      typeof payload.nextCursor === "string" ? payload.nextCursor : null;
    setNextCursor(cursor);
    lastLoadedQuery.current = querySignature(input.query);
    return cursor;
  }

  function scheduleQueryReload(query: RecordQuery) {
    activeQuery.current = query;
    if (queryTimer.current) {
      clearTimeout(queryTimer.current);
      queryTimer.current = null;
    }
    requestSequence.current += 1;
    if (querySignature(query) === lastLoadedQuery.current) return;
    queryTimer.current = setTimeout(() => {
      queryTimer.current = null;
      setError(null);
      void fetchRows({ append: false, query }).catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load rows.",
        );
      });
    }, 250);
  }

  function syncVisibleFields(api: GridApi<CollectionRecord>) {
    setVisibleFieldIds(
      api
        .getColumnState()
        .filter((column) => !column.hide && fieldsById.has(column.colId))
        .map((column) => column.colId),
    );
  }

  function openView(viewId: string) {
    const parameters = new URLSearchParams(searchParams.toString());
    parameters.set("view", viewId);
    parameters.delete("record");
    router.replace(`?${parameters.toString()}`, { scroll: false });
  }

  async function saveView(asNewName?: string) {
    const api = gridApi.current;
    if (!api || isSavingView) return;
    const newName = asNewName?.trim() || null;
    if (asNewName !== undefined && !newName) return;
    setError(null);
    setIsSavingView(true);
    try {
      const columnState = api.getColumnState();
      const sorts = savedSorts(api, fieldsById);
      const body = {
        ...(!newName && savedView
          ? { expectedVersion: savedView.version, viewId: savedView.id }
          : {}),
        filters: savedFilters(api.getFilterModel(), fieldsById),
        isDefault: newName
          ? false
          : (savedView?.isDefault ?? views.length === 0),
        name: newName ?? savedView?.name ?? "Default",
        sorts,
        visibleFieldIds: columnState
          .filter((column) => !column.hide && fieldsById.has(column.colId))
          .map((column) => column.colId),
      };
      const response = await fetch(API_ROUTES.collections.views(collectionId), {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: unknown;
        view?: { id?: unknown; name?: unknown; version?: unknown };
      } | null;
      if (
        !response.ok ||
        typeof payload?.view?.id !== "string" ||
        typeof payload.view.name !== "string" ||
        typeof payload.view.version !== "number"
      ) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Could not save the view.",
        );
      }
      setSavedView({
        id: payload.view.id,
        isDefault: body.isDefault,
        name: payload.view.name,
        version: payload.view.version,
      });
      setViewSaved(true);
      if (newName) {
        setNewViewName("");
        openView(payload.view.id);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the view.",
      );
    } finally {
      setIsSavingView(false);
    }
  }

  async function exportCsv() {
    const api = gridApi.current;
    if (!api || isExportingCsv) return;
    setError(null);
    setIsExportingCsv(true);
    try {
      // The grid holds only the loaded pages; pull every remaining page first
      // so the CSV covers the whole (filtered) result set, not just the rows
      // scrolled into view.
      let cursor = nextCursor;
      while (cursor) {
        cursor = await fetchRows({
          append: true,
          cursor,
          query: activeQuery.current,
        });
      }
      const base = (collectionName ?? collectionId)
        .replace(/[^\w.-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80);
      api.exportDataAsCsv({
        columnKeys: visibleFieldIds,
        fileName: `${base || collectionId}.csv`,
      });
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Could not export the rows.",
      );
    } finally {
      setIsExportingCsv(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || isLoadingMore) return;
    setError(null);
    setIsLoadingMore(true);
    try {
      await fetchRows({
        append: true,
        cursor: nextCursor,
        query: activeQuery.current,
      });
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load more rows.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="relative w-full sm:max-w-sm sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <span className="sr-only">Search rows</span>
          <Input
            className="w-full rounded-none pl-9 shadow-none"
            onChange={(event) => {
              const query = event.target.value;
              setQuickFilter(query);
              scheduleQueryReload({ ...activeQuery.current, query });
            }}
            placeholder="Search rows"
            type="search"
            value={quickFilter}
          />
        </label>
        {views.length ? (
          <Select value={initialView?.id} onValueChange={openView}>
            <Select.Trigger
              aria-label="Saved view"
              className="w-44 rounded-none shadow-none"
            >
              <Select.Value placeholder="Saved view" />
            </Select.Trigger>
            <Select.Content>
              {views.map((view) => (
                <Select.Item key={view.id} value={view.id}>
                  {view.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        ) : null}
        <Popover>
          <Popover.Trigger asChild>
            <Button
              className="gap-2 shadow-none"
              size="sm"
              type="button"
              variant="outline"
            >
              <Columns3 className="h-4 w-4" />
              Columns
            </Button>
          </Popover.Trigger>
          <Popover.Content
            align="end"
            className="w-64 rounded-none border border-foreground p-3 shadow-none"
          >
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {orderedFields.map((field) => (
                <label
                  className="flex items-center gap-2 text-sm"
                  key={field.id}
                >
                  <Checkbox
                    checked={visibleFieldIds.includes(field.id)}
                    disabled={
                      visibleFieldIds.includes(field.id) &&
                      visibleFieldIds.length === 1
                    }
                    onCheckedChange={(checked) => {
                      setViewSaved(false);
                      gridApi.current?.setColumnsVisible(
                        [field.id],
                        checked === true,
                      );
                      if (gridApi.current) syncVisibleFields(gridApi.current);
                    }}
                  />
                  <span className="min-w-0 truncate">{field.name}</span>
                </label>
              ))}
            </div>
          </Popover.Content>
        </Popover>
        <Button
          className="gap-2 shadow-none"
          disabled={isExportingCsv}
          onClick={() => void exportCsv()}
          size="sm"
          type="button"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          {isExportingCsv ? "Exporting" : "Export CSV"}
        </Button>
        {canSaveView ? (
          <>
            <Button
              className="gap-2 shadow-none"
              disabled={isSavingView}
              onClick={() => void saveView()}
              size="sm"
              type="button"
              variant="outline"
            >
              {viewSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSavingView ? "Saving" : viewSaved ? "Saved" : "Save view"}
            </Button>
            <Popover>
              <Popover.Trigger asChild>
                <Button
                  aria-label="New view"
                  className="shadow-none"
                  disabled={isSavingView}
                  size="icon"
                  title="New view"
                  type="button"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </Popover.Trigger>
              <Popover.Content
                align="end"
                className="w-72 rounded-none border border-foreground p-3 shadow-none"
              >
                <form
                  className="flex gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveView(newViewName);
                  }}
                >
                  <Input
                    aria-label="View name"
                    className="min-w-0 flex-1 rounded-none shadow-none"
                    maxLength={200}
                    onChange={(event) => setNewViewName(event.target.value)}
                    placeholder="View name"
                    value={newViewName}
                  />
                  <Button
                    aria-label="Create view"
                    className="shadow-none"
                    disabled={!newViewName.trim() || isSavingView}
                    size="icon"
                    title="Create view"
                    type="submit"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </Popover.Content>
            </Popover>
          </>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-sm font-medium">{error}</p> : null}

      <div className="mt-3 w-full" style={{ height: gridHeight }}>
        <AgGridReact<CollectionRecord>
          animateRows={false}
          columnDefs={columnDefs}
          context={gridContext}
          defaultColDef={GRID_DEFAULT_COLUMN}
          enableCellTextSelection
          getRowId={({ data }) => data.id}
          headerHeight={40}
          initialState={initialState}
          maintainColumnOrder
          onCellEditRequest={(event) => void saveCell(event)}
          onColumnMoved={({ api, finished }) => {
            if (finished) {
              setViewSaved(false);
              syncVisibleFields(api);
            }
          }}
          onColumnVisible={({ api }) => {
            setViewSaved(false);
            syncVisibleFields(api);
          }}
          onFilterChanged={({ api }) => {
            setViewSaved(false);
            scheduleQueryReload({
              ...activeQuery.current,
              filters: savedFilters(api.getFilterModel(), fieldsById),
            });
          }}
          onGridReady={({ api }) => {
            gridApi.current = api;
            syncVisibleFields(api);
          }}
          onFirstDataRendered={({ api }) => {
            if (!focusedRecordId) return;
            const row = api.getRowNode(focusedRecordId);
            if (!row) return;
            api.ensureNodeVisible(row, "middle");
            api.flashCells({ rowNodes: [row] });
          }}
          pagination
          paginationPageSize={25}
          paginationPageSizeSelector={GRID_PAGE_SIZES}
          quickFilterText={quickFilter}
          readOnlyEdit
          rowData={records}
          rowHeight={42}
          singleClickEdit
          onSortChanged={({ api }) => {
            setViewSaved(false);
            scheduleQueryReload({
              ...activeQuery.current,
              sorts: savedSorts(api, fieldsById),
            });
          }}
          stopEditingWhenCellsLoseFocus
          theme={GRID_THEME}
          tooltipShowDelay={300}
        />
      </div>

      {nextCursor ? (
        <div className="mt-3 flex justify-center">
          <Button
            className="shadow-none"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
            size="sm"
            type="button"
            variant="outline"
          >
            {isLoadingMore ? "Loading" : "Load more rows"}
          </Button>
        </div>
      ) : null}
    </>
  );
}
