// Per-column display settings for the collection records grid.
//
// TODO(persistence): durable per-view persistence needs a
// `CollectionView.columnSettingsJson` column + migration (owner approval
// pending). Until that lands, these per-column display settings live only in
// localStorage on the current browser. `loadColumnSettings`/`saveColumnSettings`
// below are the single swap point: replace their bodies with server reads/writes
// once the migration exists, and callers keep working unchanged.

export type ColumnAlign = "center" | "left" | "right";

export interface ColumnDisplaySettings {
  align?: ColumnAlign;
  format?: string;
  wrapText?: boolean;
}

export type ColumnSettingsMap = Record<string, ColumnDisplaySettings>;

const KEY_PREFIX = "optimitron:collection-columns";

function storageKey(collectionId: string, viewId: string | null): string {
  return `${KEY_PREFIX}:${collectionId}:${viewId ?? "default"}`;
}

export function loadColumnSettings(
  collectionId: string,
  viewId: string | null,
): ColumnSettingsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(collectionId, viewId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ColumnSettingsMap;
  } catch {
    return {};
  }
}

export function saveColumnSettings(
  collectionId: string,
  viewId: string | null,
  settings: ColumnSettingsMap,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(collectionId, viewId);
    if (!settings || Object.keys(settings).length === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    // Non-fatal: private-mode, quota, or disabled storage. Settings simply do
    // not persist across reloads in that browser.
  }
}

// Formats a grid cell for display. Extends the grid's original null/array/string
// fallback with optional number/date formatting. Never throws: any bad value or
// formatter error falls back to the raw string so the grid keeps rendering.
export function formatCellValue(
  fieldType: string,
  format: string | undefined,
  value: unknown,
): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.join(", ");

  if (fieldType === "NUMBER" && format && format !== "plain") {
    const numeric = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(numeric)) {
      try {
        switch (format) {
          case "comma":
            return new Intl.NumberFormat("en-US").format(numeric);
          case "currency":
            return new Intl.NumberFormat("en-US", {
              currency: "USD",
              style: "currency",
            }).format(numeric);
          case "percent":
            return new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 2,
              style: "percent",
            }).format(numeric);
          default:
            break;
        }
      } catch {
        return String(value);
      }
    }
    return String(value);
  }

  if (fieldType === "DATE" && format) {
    const raw = String(value);
    // Date-only values (the editor/filters store YYYY-MM-DD) must parse in
    // LOCAL time: new Date("2026-07-19") is UTC midnight, which renders as the
    // previous calendar day west of UTC. Full timestamps parse as-is.
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);
    const parsed = dateOnly
      ? new Date(
          Number(raw.slice(0, 4)),
          Number(raw.slice(5, 7)) - 1,
          Number(raw.slice(8, 10)),
        )
      : new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    try {
      switch (format) {
        case "iso": {
          const y = parsed.getFullYear();
          const m = String(parsed.getMonth() + 1).padStart(2, "0");
          const d = String(parsed.getDate()).padStart(2, "0");
          return `${y}-${m}-${d}`;
        }
        case "local":
          return parsed.toLocaleDateString();
        case "medium":
          return parsed.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        default:
          return raw;
      }
    } catch {
      return raw;
    }
  }

  return String(value);
}
