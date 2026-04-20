"use client";

import { SCRIPT_UPDATES } from "@/lib/reasoning/call-script";

/**
 * Public changelog shown on the conclusion screen + terminal-decline.
 * Visible-belief-update instrumentation — asymmetric updatability is
 * the cult tell; visible updates are the truth-seeking-tool tell.
 */
export function UpdateLog() {
  if (SCRIPT_UPDATES.length === 0) return null;
  return (
    <div className="mx-auto mt-8 max-w-2xl border-2 border-primary bg-muted p-4">
      <h3 className="font-black uppercase text-xs mb-2">
        Script Update Log
      </h3>
      <ul className="space-y-1 text-xs font-bold text-muted-foreground">
        {SCRIPT_UPDATES.map((u, i) => (
          <li key={i}>
            <span className="font-black">{u.date}</span> — {u.change}{" "}
            <span className="italic">({u.reason})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
