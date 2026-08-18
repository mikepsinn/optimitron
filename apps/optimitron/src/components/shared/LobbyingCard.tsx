import type { LobbyingIndustry } from "@optimitron/data/datasets/us-lobbying";
import { BrutalCard } from "@/components/ui/brutal-card";

interface LobbyingCardProps {
  industry: LobbyingIndustry;
}

function formatUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

/**
 * Mini sparkline SVG for trend data. Pure SVG, no dependencies.
 */
function Sparkline({ data }: { data: { year: number; value: number }[] }) {
  if (data.length < 2) return null;

  const W = 120;
  const H = 32;
  const PAD = 2;

  const values = data.map((d) => d.value);
  const vMin = Math.min(...values);
  const vMax = Math.max(...values);
  const vRange = vMax - vMin || 1;

  const years = data.map((d) => d.year);
  const yMin = Math.min(...years);
  const yMax = Math.max(...years);
  const yRange = yMax - yMin || 1;

  const points = data
    .map((d) => {
      const x = PAD + ((d.year - yMin) / yRange) * (W - PAD * 2);
      const y = PAD + (H - PAD * 2) - ((d.value - vMin) / vRange) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-[120px] h-[32px]"
      role="img"
      aria-label="Spending trend sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--foreground)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * BrutalCard for a single lobbying industry.
 * Shows: emoji + name, annual spend (large), total spend, what they lobbied for,
 * what they got (in brutal-red), source link, and mini sparkline if trend data exists.
 */
export function LobbyingCard({ industry }: LobbyingCardProps) {
  return (
    <BrutalCard bgColor="default" shadowSize={8} padding="md" hover>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2">
          <span className="text-2xl" role="img" aria-hidden="true">
            {industry.emoji}
          </span>
          <h4 className="text-sm font-black uppercase text-foreground leading-tight">
            {industry.industry}
          </h4>
        </div>
        {industry.trend && industry.trend.length >= 2 && (
          <Sparkline data={industry.trend} />
        )}
      </div>

      {/* Annual spend */}
      <p className="text-3xl font-black text-foreground mb-1">
        {formatUsd(industry.annualSpending)}
        <span className="text-sm font-bold text-muted-foreground ml-1">/yr</span>
      </p>

      {/* Total spend */}
      <p className="text-xs font-bold text-muted-foreground mb-4">
        {formatUsd(industry.totalSpending1998to2024)} total (1998–2024)
      </p>

      {/* What they lobbied for */}
      <div className="mb-3">
        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
          What They Lobbied For
        </span>
        <p className="text-sm font-bold text-foreground mt-1 leading-relaxed">
          {industry.topIssue}
        </p>
      </div>

      {/* What they got */}
      <div className="mb-3">
        <span className="text-[10px] font-black uppercase text-brutal-red tracking-widest">
          What They Got
        </span>
        <p className="text-sm font-bold text-brutal-red mt-1 leading-relaxed">
          {industry.whatTheyGot}
        </p>
      </div>

      {/* Source */}
      <div className="pt-3 border-t-4 border-primary">
        <a
          href={industry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-muted-foreground hover:text-background transition-colors"
        >
          {industry.source} ↗
        </a>
      </div>
    </BrutalCard>
  );
}
