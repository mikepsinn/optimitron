"use client";

import { useMemo, useState } from "react";

/**
 * The Decentralized FDA treatment ranking table. Searchable, sortable,
 * switchable between conditions. Data is the repo's illustrative medical
 * dataset (the spec's fallback when the live studies.dfda.earth API is not
 * wired), serialized by the server component and passed down as props.
 */
export interface RankingRow {
  name: string;
  effectiveness: number;
  safetyScore: number;
  confidenceScore: number;
  participants: number;
  dosageRange: string | null;
}

export interface RankingCondition {
  conditionName: string;
  rows: RankingRow[];
}

type SortKey = "effectiveness" | "safetyScore" | "confidenceScore" | "participants";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "effectiveness", label: "Effect" },
  { key: "safetyScore", label: "Safety" },
  { key: "participants", label: "Sample size (N)" },
  { key: "confidenceScore", label: "Confidence" },
];

export function DfdaRankingTable({ conditions }: { conditions: RankingCondition[] }) {
  const [conditionIdx, setConditionIdx] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("effectiveness");
  const [query, setQuery] = useState("");

  const condition = conditions[conditionIdx];
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? condition.rows.filter((r) => r.name.toLowerCase().includes(q))
      : condition.rows;
    return [...filtered].sort((a, b) => b[sortKey] - a[sortKey]);
  }, [condition, sortKey, query]);

  return (
    <div>
      <div className="eos-condition-tabs">
        {conditions.map((c, i) => (
          <button
            className="eos-toggle"
            data-active={i === conditionIdx}
            key={c.conditionName}
            onClick={() => setConditionIdx(i)}
            type="button"
          >
            {c.conditionName}
          </button>
        ))}
        <input
          aria-label="Search treatments"
          className="eos-input"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search treatments"
          style={{ fontSize: "0.8rem", padding: "0.45rem 0.7rem", width: "11rem", marginLeft: "auto" }}
          type="search"
          value={query}
        />
      </div>
      <div className="eos-table-scroll">
        <table className="eos-rank-table">
          <thead>
            <tr>
              <th aria-sort="none">Treatment</th>
              {COLUMNS.map((c) => (
                <th
                  aria-sort={sortKey === c.key ? "descending" : "none"}
                  data-sorted={sortKey === c.key}
                  key={c.key}
                  onClick={() => setSortKey(c.key)}
                  title={`Sort by ${c.label}`}
                >
                  {c.label}
                  {sortKey === c.key ? " ↓" : ""}
                </th>
              ))}
              <th>Optimal dose</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td style={{ color: "var(--eos-mint)" }}>{r.effectiveness}%</td>
                <td>{r.safetyScore}%</td>
                <td>{r.participants.toLocaleString("en-US")}</td>
                <td>{r.confidenceScore}%</td>
                <td style={{ color: "var(--eos-ink-muted)" }}>
                  {r.dosageRange ?? "n/a"}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ color: "var(--eos-ink-muted)" }}>
                  No treatments match &ldquo;{query}&rdquo;.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
