"use client";

import { Tooltip } from "@/components/retroui/Tooltip";

interface ColumnHelpProps {
  /** Explanation text shown on hover */
  text: string;
}

/**
 * Tiny "?" circle with a tooltip — designed for table column headers.
 */
export function ColumnHelp({ text }: ColumnHelpProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip>
        <Tooltip.Trigger asChild>
          <span
            className="inline-flex items-center justify-center w-4 h-4 border-2 border-primary bg-muted text-[9px] font-black leading-none cursor-help ml-1 align-middle"
            aria-label="Help"
          >
            ?
          </span>
        </Tooltip.Trigger>
        <Tooltip.Content
          variant="solid"
          className="max-w-xs text-xs font-bold"
        >
          {text}
        </Tooltip.Content>
      </Tooltip>
    </Tooltip.Provider>
  );
}
