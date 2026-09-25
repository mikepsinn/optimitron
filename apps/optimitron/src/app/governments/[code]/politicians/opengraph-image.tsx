import { ImageResponse } from "next/og";
import { getGovernmentMetrics } from "@optimitron/data/datasets/government-report-cards";
import { getPoliticianScorecardData } from "@/lib/politician-scorecards";

export const runtime = "nodejs";
export const revalidate = 86400;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const gov = getGovernmentMetrics(code.toUpperCase());
  const systemRatio = getPoliticianScorecardData().systemWideRatio.toLocaleString("en-US");

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        padding: 60,
        fontFamily: "sans-serif",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", fontSize: 80, fontWeight: 900, textTransform: "uppercase", letterSpacing: -3, gap: 16 }}>
        <span>{gov?.flag ?? "🌍"}</span>
        <span>{gov?.name ?? code}</span>
      </div>
      <div style={{ fontSize: 40, fontWeight: 900, color: "#ef4444", marginTop: 20, textTransform: "uppercase" }}>
        Politician Scorecards
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#888", marginTop: 20, maxWidth: 900 }}>
        Military spending and clinical-trial funding each politician voted for.
      </div>
      <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#ef4444", padding: "16px 24px", border: "4px solid #fff" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: "#fff" }}>{`${systemRatio}:1`}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>MILITARY-TO-TRIALS RATIO</div>
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: "#FF6B9D", textTransform: "uppercase", marginTop: "auto" }}>
        The Earth Optimization Game · optimitron.com
      </div>
    </div>,
    { ...size },
  );
}
