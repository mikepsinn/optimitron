"use client";

import { cn } from "@/lib/utils";

export function ProbabilitySlider({
  label,
  value,
  min = 0.01,
  max = 1,
  onChange,
  className,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="text-xs font-black uppercase whitespace-nowrap">
        {label}
      </span>
      <input
        type="range"
        min={min * 100}
        max={max * 100}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="flex-1 h-2 bg-foreground appearance-none cursor-pointer"
      />
      <span className="text-xs font-black w-12 text-right">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
