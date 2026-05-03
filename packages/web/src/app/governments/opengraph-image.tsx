import { ImageResponse } from "next/og";
import { GOVERNMENTS } from "@optimitron/data/datasets/government-report-cards";

export const runtime = "nodejs";
export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fmt(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

export default function OGImage() {
  const totalMilitary = GOVERNMENTS.reduce(
    (sum, g) => sum + g.militarySpendingAnnual.value,
    0,
  );
  const totalClinical = GOVERNMENTS.reduce(
    (sum, g) => sum + (g.clinicalTrialSpending?.value ?? 0),
    0,
  );
  const totalDeaths = GOVERNMENTS.reduce(
    (sum, g) => sum + g.militaryDeathsCaused.value,
    0,
  );

  const barMax = 1080;
  const milPct = totalMilitary / (totalMilitary + totalClinical);
  const milBarWidth = Math.round(milPct * barMax);
  const trialsBarWidth = Math.max(barMax - milBarWidth, 4);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        padding: "50px 60px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 56, fontWeight: 900, textTransform: "uppercase", letterSpacing: -2 }}>
        Body Count Leaderboard
      </div>
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#888", marginTop: 8 }}>
        {GOVERNMENTS.length} governments audited · {totalDeaths.toLocaleString()} deaths in the ledger
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#ef4444", textTransform: "uppercase" }}>Combined Military Spending</div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#ef4444" }}>{fmt(totalMilitary)}/yr</div>
          </div>
          <div style={{ display: "flex", width: "100%", height: 56, backgroundColor: "#1a1a1a", border: "3px solid #333" }}>
            <div style={{ display: "flex", width: milBarWidth, height: "100%", backgroundColor: "#ef4444" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#00D9FF", textTransform: "uppercase" }}>Combined Clinical Trials</div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#00D9FF" }}>{fmt(totalClinical)}/yr</div>
          </div>
          <div style={{ display: "flex", width: "100%", height: 56, backgroundColor: "#1a1a1a", border: "3px solid #333" }}>
            <div style={{ display: "flex", width: trialsBarWidth, height: "100%", backgroundColor: "#00D9FF" }} />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
        <div style={{ display: "flex", fontSize: 15, fontWeight: 700, color: "#666" }}>
          optimitron.earth
        </div>
        <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#FF6B9D", textTransform: "uppercase" }}>
          The Earth Optimization Game
        </div>
      </div>
    </div>,
    { ...size },
  );
}
