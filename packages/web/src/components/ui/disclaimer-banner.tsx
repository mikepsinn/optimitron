import { AlertTriangle } from "lucide-react";

interface DisclaimerBannerProps {
  /** Compact single-line version for inline use in calculators */
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: DisclaimerBannerProps) {
  if (compact) {
    return (
      <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground px-4 py-2 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-xs font-bold">
          For entertainment purposes only. All figures are hypothetical
          projections, not guarantees. Not financial advice.
        </p>
      </div>
    );
  }

  return (
    <div className="border-4 border-primary bg-brutal-yellow text-brutal-yellow-foreground p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-black uppercase">
            For Entertainment &amp; Educational Purposes Only
          </p>
          <p className="text-xs font-bold leading-relaxed">
            The Earth Optimization Prize Fund is a concept currently seeking a
            foundation host. All return figures — including the projected 17%
            annual growth based on VC-sector diversification — are hypothetical
            projections, not guarantees. This is not financial advice, an
            investment offering, or a solicitation of funds. No returns are
            promised or guaranteed. Interested in learning more? Contact{" "}
            <a
              href="mailto:hello@warondisease.org"
              className="font-black underline hover:text-foreground transition-colors"
            >
              hello@warondisease.org
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
}
