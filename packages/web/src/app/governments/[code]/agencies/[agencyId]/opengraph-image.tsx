import { ImageResponse } from "next/og";
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { getAgencyPerformance } from "@optimitron/data/datasets/agency-performance";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fmt(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

export const revalidate = 86400;

export default async function OGImage({ params }: { params: Promise<{ code: string; agencyId: string }> }) {
  const { code, agencyId } = await params;
  const gov = getGovernmentMetrics(code.toUpperCase());
  const agency = getAgencyPerformance(agencyId, code.toUpperCase());

  if (!gov || !agency) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#000", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900 }}>
        Agency Not Found
      </div>,
      { ...size },
    );
  }

  const gradeColors: Record<string, string> = {
    A: "#00D9FF",
    B: "#00D9FF",
    C: "#FFD600",
    D: "#FFD600",
    F: "#ef4444",
  };
  const gradeColor = gradeColors[agency.grade] ?? "#888";

  const spendSeries = agency.spendingTimeSeries;
  const latestSpend = spendSeries.length > 0 ? spendSeries[spendSeries.length - 1]!.value : 0;

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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", fontSize: 64 }}>{agency.emoji}</div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 900, textTransform: "uppercase", letterSpacing: -2, lineHeight: 1.1 }}>
            {agency.agencyName}
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#888", marginTop: 4 }}>
            {gov.flag} {gov.name} · Agency Report Card
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            border: `4px solid ${gradeColor}`,
            fontSize: 64,
            fontWeight: 900,
            color: gradeColor,
          }}
        >
          {agency.grade}
        </div>
      </div>

      {/* Mission */}
      <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#aaa", marginTop: 24, maxWidth: 1000 }}>
        {agency.mission}
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 40, marginTop: 32 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>Annual Spending</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#ef4444" }}>{fmt(latestSpend)}</div>
        </div>
        {agency.outcomes[0] && agency.outcomes[0].data.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase" }}>{agency.outcomes[0].label}</div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 900, color: "#00D9FF" }}>
              {agency.outcomes[0].data[agency.outcomes[0].data.length - 1]!.value.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Rationale */}
      <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#666", marginTop: 24, maxWidth: 1000 }}>
        {agency.gradeRationale}
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
