import { ImageResponse } from "next/og";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getMilitarySynonym, getMilitarySynonymTitle } from "@/lib/messaging";
import {
  formatPoliticianOgDescriptor,
  formatPoliticianOgRatio,
} from "@/lib/politician-og";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function loadScorecardData(): { scorecards: Array<{ bioguideId: string; name: string; party: string; state: string; chamber: string; militaryDollarsVotedFor: number; clinicalTrialDollarsVotedFor: number; ratio: number }>, systemWideRatio: number } | null {
  try {
    const p = join(process.cwd(), "..", "data", "src", "datasets", "generated", "politician-scorecards.json");
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
    return null;
  } catch { return null; }
}

function fmt(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(0)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (v === 0) return "$0";
  return `$${v.toLocaleString()}`;
}

export function generateStaticParams() {
  const data = loadScorecardData();
  return (data?.scorecards ?? []).map((s) => ({
    code: "US",
    bioguideId: s.bioguideId,
  }));
}

export default async function OGImage({ params }: { params: Promise<{ code: string; bioguideId: string }> }) {
  const { bioguideId } = await params;
  const data = loadScorecardData();
  const p = data?.scorecards.find((s) => s.bioguideId === bioguideId.toUpperCase());

  if (!p) {
    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#000", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 900 }}>
        Politician Not Found
      </div>,
      { ...size },
    );
  }

  const total = p.militaryDollarsVotedFor + p.clinicalTrialDollarsVotedFor;
  const milPct = total > 0 ? (p.militaryDollarsVotedFor / total) * 100 : 50;
  const trialsPct = total > 0 ? (p.clinicalTrialDollarsVotedFor / total) * 100 : 50;
  const ratioText = formatPoliticianOgRatio(p.ratio);
  const descriptorText = formatPoliticianOgDescriptor([
    p.party,
    p.chamber,
    p.state,
  ]);

  // SVG pie chart using stroke-dasharray trick
  // Circle circumference = 2πr = 2π×90 ≈ 565.5
  const circumference = 2 * Math.PI * 90;
  const milDash = (milPct / 100) * circumference;
  const trialsDash = circumference - milDash;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        padding: "50px 60px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Left side: info */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, marginRight: 40 }}>
        {/* Name + party */}
        <div style={{ fontSize: 48, fontWeight: 900, textTransform: "uppercase", letterSpacing: -2, lineHeight: 1.1 }}>
          {p.name}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#888", marginTop: 8 }}>
          {descriptorText}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 32, marginTop: 32 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444", textTransform: "uppercase" }}>{getMilitarySynonym(p.bioguideId + "-og-stat")}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#ef4444" }}>{fmt(p.militaryDollarsVotedFor)}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{milPct.toFixed(1)}%</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#00D9FF", textTransform: "uppercase" }}>Testing Medicines</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#00D9FF" }}>{fmt(p.clinicalTrialDollarsVotedFor)}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#00D9FF" }}>{trialsPct.toFixed(2)}%</div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#666" }}>
            optimitron.earth
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#FF6B9D", textTransform: "uppercase" }}>
            The Earth Optimization Game
          </div>
        </div>
      </div>

      {/* Right side: pie chart */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 320 }}>
        <svg width="240" height="240" viewBox="0 0 200 200">
          {/* Background circle (military - red) */}
          <circle
            cx="100" cy="100" r="90"
            fill="none"
            stroke="#ef4444"
            strokeWidth="80"
            strokeDasharray={`${milDash} ${trialsDash}`}
            strokeDashoffset={circumference / 4}
            transform="rotate(-90 100 100)"
          />
          {/* Trials slice (cyan) — overlaid */}
          {trialsPct > 0.01 && (
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="#00D9FF"
              strokeWidth="80"
              strokeDasharray={`${trialsDash} ${milDash}`}
              strokeDashoffset={-(milDash - circumference / 4)}
              transform="rotate(-90 100 100)"
            />
          )}
        </svg>
        {/* Ratio in center */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "absolute",
          top: "50%",
          marginTop: -30,
        }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: "#fff" }}>{ratioText}</div>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, backgroundColor: "#ef4444" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa" }}>{getMilitarySynonymTitle(p.bioguideId + "-og-legend")}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 12, backgroundColor: "#00D9FF" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa" }}>Medicines</div>
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
