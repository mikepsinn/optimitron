"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/retroui/Button";
import { Command } from "@/components/retroui/Command";
import { Popover } from "@/components/retroui/Popover";
import { cn } from "@/lib/utils";
import {
  GOVERNMENT_SCATTER_METRICS,
  type GovernmentScatterMetric,
  type GovernmentScatterMetricKey,
} from "./governmentScatterplotMetrics";

interface GovernmentScatterMetricPickerProps {
  label: string;
  value: GovernmentScatterMetricKey;
  onValueChange: (value: GovernmentScatterMetricKey) => void;
}

export function filterGovernmentScatterMetricOptions(
  query: string,
  metrics: GovernmentScatterMetric[] = GOVERNMENT_SCATTER_METRICS,
): GovernmentScatterMetric[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return metrics;
  }

  return metrics.filter((metric) =>
    `${metric.label} ${metric.key}`.toLowerCase().includes(normalizedQuery),
  );
}

export function GovernmentScatterMetricPicker({
  label,
  value,
  onValueChange,
}: GovernmentScatterMetricPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedMetric =
    GOVERNMENT_SCATTER_METRICS.find((metric) => metric.key === value) ??
    GOVERNMENT_SCATTER_METRICS[0];
  const filteredMetrics = filterGovernmentScatterMetricOptions(query);

  return (
    <label className="flex w-full flex-col gap-2">
      <span className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-4 border-primary bg-background px-4 py-2 font-black text-foreground"
          >
            <span className="truncate">{selectedMetric.label}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </Popover.Trigger>
        <Popover.Content
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-0 border-4 border-primary p-0"
        >
          <Command shouldFilter={false}>
            <Command.Input
              placeholder={`Search ${label.toLowerCase()} metrics...`}
              value={query}
              onValueChange={setQuery}
            />
            <Command.List className="max-h-[min(50vh,22rem)]">
              <Command.Empty>No matching metrics.</Command.Empty>
              <Command.Group>
                {filteredMetrics.map((metric) => (
                  <Command.Item
                    key={metric.key}
                    value={metric.key}
                    onSelect={() => {
                      onValueChange(metric.key);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <span className="truncate">{metric.label}</span>
                    <Command.Check
                      className={cn(
                        value === metric.key ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover>
    </label>
  );
}
