import { ImageResponse } from "next/og";
import { getGovernmentMetrics } from "@optimitron/data";

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

export default async function OGImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const gov = getGovernmentMetrics(code.toUpperCase());

  if (!gov) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#000", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900 }}>
        Country Not Found
      </div>,
      { ...size },
    );
  }

  const milSpend = gov.militarySpendingAnnual.value;
  const clinSpend = gov.clinicalTrialSpending?.value ?? 0;
  const total = milSpend + clinSpend;
  const barMax = 1080;
  const milBarWidth = total > 0 ? Math.round((milSpend / total) * barMax) : barMax;
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
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", fontSize: 64 }}>{gov.flag}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 900, textTransform: "uppercase", letterSpacing: -2 }}>
            {gov.name}
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#888" }}>
            Government Scorecard
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: "flex", gap: 40, marginTop: 28 }}>
        {gov.hale && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>HALE</div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#00D9FF" }}>{gov.hale.value.toFixed(1)} yrs</div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Body Count</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#ef4444" }}>{gov.militaryDeathsCaused.value.toLocaleString()}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>GDP/Capita</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#fff" }}>{fmt(gov.gdpPerCapita.value)}</div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 900, color: "#ef4444", textTransform: "uppercase" }}>Military Spending</div>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 900, color: "#ef4444" }}>{fmt(milSpend)}/yr</div>
          </div>
          <div style={{ display: "flex", width: "100%", height: 44, backgroundColor: "#1a1a1a", border: "3px solid #333" }}>
            <div style={{ display: "flex", width: milBarWidth, height: "100%", backgroundColor: "#ef4444" }} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 900, color: "#00D9FF", textTransform: "uppercase" }}>Clinical Trials</div>
            <div style={{ display: "flex", fontSize: 16, fontWeight: 900, color: "#00D9FF" }}>{fmt(clinSpend)}/yr</div>
          </div>
          <div style={{ display: "flex", width: "100%", height: 44, backgroundColor: "#1a1a1a", border: "3px solid #333" }}>
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
