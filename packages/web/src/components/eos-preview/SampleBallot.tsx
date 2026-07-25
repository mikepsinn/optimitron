"use client";

import { useState } from "react";

/**
 * The Decentralized Congress sample ballot question with the OPG's evidence
 * card attached. The [X]/[Y]/[Z]/[calculated] values are the spec's own
 * placeholders (the evidence pipeline for this demo question is not wired);
 * they render visibly provisional rather than inventing numbers.
 */
export function SampleBallot() {
  const [picked, setPicked] = useState<"yes" | "no" | null>(null);

  return (
    <div className="eos-panel">
      <p className="eos-eyebrow">Sample ballot</p>
      <p
        className="eos-product-tagline"
        style={{ color: "var(--eos-cream)", marginTop: "0.75rem", fontWeight: 600 }}
      >
        Question: Should the sugar subsidy ($4.1B/year) continue?
      </p>
      <div className="eos-panel-soft" style={{ marginTop: "1.25rem" }}>
        <p className="eos-eyebrow" style={{ marginBottom: "0.6rem" }}>
          Evidence card
        </p>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--eos-ink-soft)" }}>
          Jurisdictions that removed sugar subsidies saw{" "}
          <span className="eos-placeholder">[X]</span> change in health
          outcomes, <span className="eos-placeholder">[Y]</span> change in food
          prices, <span className="eos-placeholder">[Z]</span> change in
          agricultural employment. Net fiscal impact:{" "}
          <span className="eos-placeholder">[calculated]</span>.
        </p>
      </div>
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <button
          className="eos-ballot-btn"
          data-picked={picked === "yes"}
          onClick={() => setPicked("yes")}
          type="button"
        >
          YES
        </button>
        <button
          className="eos-ballot-btn"
          data-picked={picked === "no"}
          onClick={() => setPicked("no")}
          type="button"
        >
          NO
        </button>
      </div>
      {picked ? (
        <p
          style={{
            marginTop: "1rem",
            fontFamily: "var(--eos-font-mono)",
            fontSize: "0.8rem",
            color: "var(--eos-mint)",
          }}
        >
          Recorded. That took you about four seconds. Nineteen more questions
          and your civic year is complete.
        </p>
      ) : null}
    </div>
  );
}
