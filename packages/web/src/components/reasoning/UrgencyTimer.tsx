"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function UrgencyTimer({
  durationSeconds = 30,
  copy = "while the math is fresh",
}: {
  durationSeconds?: number;
  copy?: string;
}) {
  const [remaining, setRemaining] = useState(durationSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [remaining]);

  const expired = remaining <= 0;
  return (
    <div
      className={cn(
        "border-4 border-primary px-4 py-2 text-center font-black uppercase",
        expired
          ? "bg-muted text-muted-foreground"
          : "bg-brutal-yellow text-brutal-yellow-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
      )}
    >
      {expired
        ? "No pressure. Send when ready."
        : `${remaining}s ${copy}`}
    </div>
  );
}
