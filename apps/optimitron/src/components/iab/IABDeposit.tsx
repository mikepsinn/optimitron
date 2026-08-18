import {
  fmtParam,
  VICTORY_BOND_ANNUAL_RETURN_PCT,
  VICTORY_BOND_ANNUAL_PAYOUT,
  TREATY_ANNUAL_FUNDING,
} from "@optimitron/data/parameters";

/**
 * Informational overview of how Incentive Alignment Bonds work.
 * IABs are Phase 2 (not yet deployed) — no wallet or deposit functionality.
 */
export function IABDeposit() {
  return (
    <div className="space-y-6">
      {/* How It Works */}
      <div className="border-4 border-primary bg-background p-6">
        <h3 className="font-black uppercase text-foreground mb-4">
          How Incentive Alignment Bonds Work
        </h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-sm font-black shrink-0 border-2 border-primary">
              1
            </span>
            <div>
              <div className="text-sm font-black text-foreground">
                Investors Buy Bonds
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                ~$1B raised from investors to fund the lobbying campaign
                for the 1% Treaty.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-background text-foreground flex items-center justify-center text-sm font-black shrink-0 border-2 border-primary">
              2
            </span>
            <div>
              <div className="text-sm font-black text-foreground">
                Money Funds the Campaign
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                Capital goes to lobbyists, Super PACs, and the awareness
                campaign. This is a real investment — the money is spent.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="w-8 h-8 bg-background text-foreground flex items-center justify-center text-sm font-black shrink-0 border-2 border-primary">
              3
            </span>
            <div>
              <div className="text-sm font-black text-foreground">
                Treaty Revenue Splits 80/10/10
              </div>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                If the treaty passes,{" "}
                {fmtParam({...TREATY_ANNUAL_FUNDING, unit: "USD"})}/year
                splits: 80% to clinical trials, 10% to bondholders
                ({fmtParam({...VICTORY_BOND_ANNUAL_PAYOUT, unit: "USD"})}/year),
                10% to aligned politicians.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Returns */}
      <div className="grid gap-4 grid-cols-2">
        <div className="border-4 border-primary bg-background text-foreground p-4">
          <div className="text-[10px] font-black uppercase">
            Projected Annual Return
          </div>
          <div className="text-xl font-black">
            {fmtParam(VICTORY_BOND_ANNUAL_RETURN_PCT)}
          </div>
          <p className="text-[10px] font-bold mt-1">
            If treaty passes — {fmtParam({...VICTORY_BOND_ANNUAL_PAYOUT, unit: "USD"})}/year
            on $1B invested
          </p>
        </div>
        <div className="border-4 border-primary bg-background text-foreground p-4">
          <div className="text-[10px] font-black uppercase">
            If Treaty Fails
          </div>
          <div className="text-xl font-black">
            $0
          </div>
          <p className="text-[10px] font-bold mt-1">
            Money was spent on the campaign — real investment, real risk
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="border-4 border-primary bg-foreground text-background p-4">
        <div className="text-xs font-black uppercase mb-1">
          Status: Phase 2 — Not Yet Deployed
        </div>
        <p className="text-xs font-bold">
          IABs deploy after the Earth Optimization Prize referendum (Phase 1)
          proves demand for the 1% Treaty.
        </p>
      </div>
    </div>
  );
}
