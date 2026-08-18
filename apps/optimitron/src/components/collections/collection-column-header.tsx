"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import type { IHeaderParams } from "ag-grid-community";
import { ArrowDown, ArrowUp, Check, MoreVertical } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type {
  ColumnAlign,
  ColumnDisplaySettings,
} from "@/components/collections/collection-column-settings";
import { Menu } from "@/components/retroui/Menu";
import { cn } from "@/lib/utils";

// The channel the grid uses to read/write per-column display settings. Passed
// through the AG Grid `context` prop (a stable object) rather than via
// headerComponentParams closures, so header memoization stays intact.
export interface CollectionGridContext {
  getColumnSetting: (colId: string) => ColumnDisplaySettings | undefined;
  onColumnSetting: (colId: string, patch: ColumnDisplaySettings | null) => void;
}

interface CollectionHeaderParams
  extends IHeaderParams<unknown, CollectionGridContext> {
  fieldType: string;
}

const ALIGNMENTS: Array<{ label: string; value: ColumnAlign }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const NUMBER_FORMATS: Array<{ label: string; value: string }> = [
  { label: "Plain", value: "plain" },
  { label: "Comma (1,000)", value: "comma" },
  { label: "Currency (USD)", value: "currency" },
  { label: "Percent", value: "percent" },
];

const DATE_FORMATS: Array<{ label: string; value: string }> = [
  { label: "ISO (YYYY-MM-DD)", value: "iso" },
  { label: "Local date", value: "local" },
  { label: "Mon D, YYYY", value: "medium" },
];

function MenuIndicator({ active }: { active: boolean }) {
  return active ? (
    <Check aria-hidden className="h-4 w-4 shrink-0" />
  ) : (
    <span aria-hidden className="h-4 w-4 shrink-0" />
  );
}

function MenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1 h-px bg-border" />;
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-2 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </DropdownMenuPrimitive.Label>
  );
}

export function CollectionColumnHeader(params: CollectionHeaderParams) {
  const { column, context, displayName, fieldType } = params;
  const colId = column.getColId();
  const [sort, setSortState] = useState<"asc" | "desc" | null>(
    () => column.getSort() ?? null,
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onSortChanged = () => setSortState(column.getSort() ?? null);
    column.addEventListener("sortChanged", onSortChanged);
    return () => column.removeEventListener("sortChanged", onSortChanged);
  }, [column]);

  // Read latest settings on every render. Opening the menu flips `menuOpen`,
  // forcing a render, so the check marks reflect the current settings.
  const setting = context.getColumnSetting(colId) ?? {};
  const align: ColumnAlign = setting.align ?? "left";
  const activeFormat = setting.format ?? "plain";
  const formatOptions =
    fieldType === "NUMBER"
      ? NUMBER_FORMATS
      : fieldType === "DATE"
        ? DATE_FORMATS
        : null;

  function cycleSort() {
    const next = sort === "asc" ? "desc" : sort === "desc" ? null : "asc";
    params.setSort(next, false);
  }

  return (
    <div className="flex h-full w-full items-center gap-1">
      <button
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1 bg-transparent font-bold",
          align === "center" && "justify-center text-center",
          align === "right" && "justify-end text-right",
        )}
        onClick={(event) => {
          event.stopPropagation();
          cycleSort();
        }}
        title={`Sort by ${displayName}`}
        type="button"
      >
        <span className="truncate">{displayName}</span>
        {sort === "asc" ? (
          <ArrowUp aria-label="Sorted ascending" className="h-3 w-3 shrink-0" />
        ) : sort === "desc" ? (
          <ArrowDown
            aria-label="Sorted descending"
            className="h-3 w-3 shrink-0"
          />
        ) : null}
      </button>

      <Menu onOpenChange={setMenuOpen} open={menuOpen}>
        <Menu.Trigger asChild>
          <button
            aria-label={`Column options for ${displayName}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-foreground hover:bg-muted"
            onClick={(event) => event.stopPropagation()}
            type="button"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </Menu.Trigger>
        <Menu.Content
          align="end"
          className="relative top-0 z-50 w-56 rounded-none border-foreground p-1"
          sideOffset={4}
        >
          <Menu.Item
            className="gap-2"
            onSelect={() => params.setSort("asc", false)}
          >
            <MenuIndicator active={sort === "asc"} />
            Sort ascending
          </Menu.Item>
          <Menu.Item
            className="gap-2"
            onSelect={() => params.setSort("desc", false)}
          >
            <MenuIndicator active={sort === "desc"} />
            Sort descending
          </Menu.Item>
          <Menu.Item
            className="gap-2"
            onSelect={() => params.setSort(null, false)}
          >
            <MenuIndicator active={sort === null} />
            Clear sort
          </Menu.Item>

          <MenuSeparator />
          <Menu.Item
            className="gap-2"
            onSelect={() =>
              context.onColumnSetting(colId, { wrapText: !setting.wrapText })
            }
          >
            <MenuIndicator active={Boolean(setting.wrapText)} />
            Wrap text
          </Menu.Item>

          <MenuSeparator />
          <MenuLabel>Align</MenuLabel>
          {ALIGNMENTS.map((option) => (
            <Menu.Item
              className="gap-2"
              key={option.value}
              onSelect={() =>
                context.onColumnSetting(colId, { align: option.value })
              }
            >
              <MenuIndicator active={align === option.value} />
              {option.label}
            </Menu.Item>
          ))}

          {formatOptions ? (
            <>
              <MenuSeparator />
              <MenuLabel>Format</MenuLabel>
              {formatOptions.map((option) => (
                <Menu.Item
                  className="gap-2"
                  key={option.value}
                  onSelect={() =>
                    context.onColumnSetting(colId, { format: option.value })
                  }
                >
                  <MenuIndicator active={activeFormat === option.value} />
                  {option.label}
                </Menu.Item>
              ))}
            </>
          ) : null}

          <MenuSeparator />
          <MenuLabel>Pin</MenuLabel>
          <Menu.Item
            className="gap-2"
            onSelect={() => params.api.setColumnsPinned([colId], "left")}
          >
            <MenuIndicator active={column.isPinnedLeft()} />
            Left
          </Menu.Item>
          <Menu.Item
            className="gap-2"
            onSelect={() => params.api.setColumnsPinned([colId], "right")}
          >
            <MenuIndicator active={column.isPinnedRight()} />
            Right
          </Menu.Item>
          <Menu.Item
            className="gap-2"
            onSelect={() => params.api.setColumnsPinned([colId], null)}
          >
            <MenuIndicator active={!column.isPinned()} />
            None
          </Menu.Item>

          <MenuSeparator />
          <Menu.Item
            className="gap-2"
            onSelect={() => params.api.setColumnsVisible([colId], false)}
          >
            <span aria-hidden className="h-4 w-4 shrink-0" />
            Hide column
          </Menu.Item>
        </Menu.Content>
      </Menu>
    </div>
  );
}
