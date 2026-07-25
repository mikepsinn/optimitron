"use client";

import { useState } from "react";
import { TREATY_ANNUAL_FUNDING } from "@optimitron/data/parameters";
import { ParameterValue } from "@/components/shared/ParameterValue";

/**
 * The Wishocracy budget slider (Featured Product 5). Three pairwise
 * comparisons from the spec; dragging any handle updates the real-time
 * output line below. The drag stays on this page.
 */
const PAIRS = [
  { a: "Clinical trials", b: "Nuclear weapons" },
  { a: "Infrastructure", b: "Corporate subsidies" },
  { a: "Pandemic defense", b: "Overseas military bases" },
] as const;

export function BudgetSlider() {
  const [values, setValues] = useState<number[]>(PAIRS.map(() => 50));
  const [lastMoved, setLastMoved] = useState(0);

  const pair = PAIRS[lastMoved];
  const v = values[lastMoved];
  // Money moves toward whichever side the visitor pushed past 50.
  const from = v >= 50 ? pair.b : pair.a;
  const to = v >= 50 ? pair.a : pair.b;

  return (
    <div className="eos-panel">
      {PAIRS.map((p, i) => {
        const val = values[i];
        return (
          <div key={p.a} style={{ marginTop: i === 0 ? 0 : "1.75rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "1rem",
                marginBottom: "0.5rem",
              }}
            >
              <span className="eos-split-value" style={{ color: "var(--eos-cyan)" }}>
                {val}%{" "}
                <span style={{ fontSize: "0.55em", fontWeight: 400 }}>{p.a}</span>
              </span>
              <span
                className="eos-split-value"
                style={{ color: "var(--eos-rose)", textAlign: "right" }}
              >
                <span style={{ fontSize: "0.55em", fontWeight: 400 }}>{p.b}</span>{" "}
                {100 - val}%
              </span>
            </div>
            <input
              aria-label={`Split funding between ${p.a} and ${p.b}`}
              className="eos-range"
              max={100}
              min={0}
              onChange={(e) => {
                const next = [...values];
                next[i] = Number(e.target.value);
                setValues(next);
                setLastMoved(i);
              }}
              style={{
                background: `linear-gradient(to right, var(--eos-cyan) ${val}%, var(--eos-rose) ${val}%)`,
              }}
              type="range"
              value={val}
            />
          </div>
        );
      })}

      <p
        className="eos-prose"
        style={{ marginTop: "1.75rem" }}
        data-volatile="slider-output"
      >
        <span style={{ color: "var(--eos-ink-soft)" }}>
          If everyone answered the way you just did,{" "}
          <ParameterValue
            className="eos-num"
            param={TREATY_ANNUAL_FUNDING}
            presentation="inline"
          />{" "}
          per year moves from {from} to {to}.
        </span>
      </p>
    </div>
  );
}
