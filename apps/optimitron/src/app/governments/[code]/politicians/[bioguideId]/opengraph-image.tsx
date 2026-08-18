import { ImageResponse } from "next/og";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getMilitarySynonymTitle } from "@/lib/messaging";
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

export const revalidate = 86400;

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
    p.chamber,
    p.state,
  ]);

  // Bar widths: military always fills most of the bar, trials gets a minimum
  // visible width so it doesn't disappear entirely
  const barMaxWidth = 1080; // px (1200 - padding)
  const milBarWidth = Math.round((milPct / 100) * barMaxWidth);
  const trialsBarWidth = Math.max(Math.round((trialsPct / 100) * barMaxWidth), 4);
  const milLabel = getMilitarySynonymTitle(p.bioguideId + "-og-bar");

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
      {/* Name + descriptor */}
      <div style={{ display: "flex", fontSize: 52, fontWeight: 900, textTransform: "uppercase", letterSpacing: -2, lineHeight: 1.1 }}>
        {p.name}
      </div>
      <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#888", marginTop: 8 }}>
        {descriptorText}
      </div>

      {/* Ratio callout */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 32 }}>
        <div style={{ display: "flex", fontSize: 56, fontWeight: 900, color: "#ef4444" }}>{ratioText}</div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700, color: "#888" }}>ratio</div>
      </div>

      {/* Horizontal bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 32 }}>
        {/* Military bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#ef4444", textTransform: "uppercase" }}>{milLabel}</div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#ef4444" }}>{fmt(p.militaryDollarsVotedFor)}</div>
          </div>
          <div style={{ display: "flex", width: "100%", height: 56, backgroundColor: "#1a1a1a", border: "3px solid #333" }}>
            <div style={{ display: "flex", width: milBarWidth, height: "100%", backgroundColor: "#ef4444" }} />
          </div>
        </div>
        {/* Clinical trials bar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#00D9FF", textTransform: "uppercase" }}>Clinical Trials</div>
            <div style={{ display: "flex", fontSize: 18, fontWeight: 900, color: "#00D9FF" }}>{fmt(p.clinicalTrialDollarsVotedFor)}</div>
          </div>
          <div style={{ display: "flex", width: "100%", height: 56, backgroundColor: "#1a1a1a", border: "3px solid #333" }}>
            <div style={{ display: "flex", width: trialsBarWidth, height: "100%", backgroundColor: "#00D9FF" }} />
          </div>
        </div>
      </div>

      {/* Bottom */}
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
