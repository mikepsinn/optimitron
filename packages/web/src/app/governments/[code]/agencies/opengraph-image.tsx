import { ImageResponse } from "next/og";
import {
  getGovernmentMetrics,
  getAgencyPerformanceByCountry,
} from "@optimitron/data";

export const runtime = "nodejs";
export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

  const agencies = getAgencyPerformanceByCountry(gov.code);
  const gradeColors: Record<string, string> = {
    A: "#00D9FF",
    B: "#00D9FF",
    C: "#FFD600",
    D: "#FFD600",
    F: "#ef4444",
  };

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
          <div style={{ display: "flex", fontSize: 48, fontWeight: 900, textTransform: "uppercase", letterSpacing: -2 }}>
            {gov.name} Agencies
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#888" }}>
            {agencies.length} agencies graded · Spending vs outcomes
          </div>
        </div>
      </div>

      {/* Agency grade badges */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 36 }}>
        {agencies.slice(0, 8).map((a) => (
          <div
            key={a.agencyId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "#111",
              border: "3px solid #333",
              padding: "12px 20px",
            }}
          >
            <div style={{ display: "flex", fontSize: 28 }}>{a.emoji}</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 16, fontWeight: 900, color: "#fff" }}>{a.agencyName}</div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 28,
                fontWeight: 900,
                color: gradeColors[a.grade] ?? "#888",
                marginLeft: 8,
              }}
            >
              {a.grade}
            </div>
          </div>
        ))}
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
